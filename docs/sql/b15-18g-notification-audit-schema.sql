-- B15.18G proposal only. Do not execute automatically.
BEGIN;

CREATE TABLE public.notification_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  notification_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'warning', 'failed', 'duplicate', 'skipped', 'actor_removed')),
  actor_user_id uuid NULL,
  recipient_user_id uuid NULL,
  recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  successful_count integer NOT NULL DEFAULT 0 CHECK (successful_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  duplicate_count integer NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  skipped_count integer NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  target_url text NULL,
  resolver_source text NULL,
  error_class text NULL,
  idempotency_key text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  last_retry_at timestamptz NULL,
  retry_allowed boolean NOT NULL DEFAULT false
);

CREATE INDEX notification_audit_created_at_idx ON public.notification_audit (created_at DESC);
CREATE INDEX notification_audit_status_created_at_idx ON public.notification_audit (status, created_at DESC);
CREATE INDEX notification_audit_type_created_at_idx ON public.notification_audit (notification_type, created_at DESC);
CREATE INDEX notification_audit_idempotency_key_idx ON public.notification_audit (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE FUNCTION public.load_notification_audit_monitoring(
  p_range text DEFAULT 'seven', p_status text DEFAULT 'all', p_search text DEFAULT '', p_limit integer DEFAULT 1000
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH scoped AS (
  SELECT * FROM public.notification_audit a
  WHERE (CASE p_range WHEN 'today' THEN a.created_at >= date_trunc('day', now()) WHEN 'seven' THEN a.created_at >= now() - interval '7 days' WHEN 'thirty' THEN a.created_at >= now() - interval '30 days' WHEN 'ninety' THEN a.created_at >= now() - interval '90 days' ELSE true END)
), filtered AS (
  SELECT * FROM scoped a WHERE (p_status = 'all' OR a.status = p_status) AND (btrim(p_search) = '' OR concat_ws(' ', a.notification_type, a.actor_user_id, a.recipient_user_id, a.target_url, a.error_class) ILIKE '%' || btrim(p_search) || '%')
  ORDER BY a.created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 5000)
), health AS (
  SELECT coalesce(sum(successful_count),0) successful, coalesce(sum(failed_count),0) failures, coalesce(sum(duplicate_count),0) duplicates, coalesce(sum(skipped_count),0) skipped,
    coalesce(sum((metadata #>> '{recipientAnalysis,actorRemoved}')::integer),0) actor_removed,
    max(created_at) FILTER (WHERE successful_count > 0) last_success, max(created_at) FILTER (WHERE failed_count > 0) last_failure
  FROM scoped
), analysis AS (
  SELECT coalesce(sum((metadata #>> '{recipientAnalysis,resolverInput}')::integer),0) resolver_input,
    coalesce(sum((metadata #>> '{recipientAnalysis,foundTrainers}')::integer),0) found_trainers,
    coalesce(sum((metadata #>> '{recipientAnalysis,activeTrainers}')::integer),0) active_trainers,
    coalesce(sum((metadata #>> '{recipientAnalysis,adminProfiles}')::integer),0) admin_profiles,
    coalesce(sum((metadata #>> '{recipientAnalysis,validAuthUsers}')::integer),0) valid_auth_users,
    coalesce(sum((metadata #>> '{recipientAnalysis,afterActorFilter}')::integer),0) after_actor_filter,
    coalesce(sum((metadata #>> '{recipientAnalysis,afterDedupe}')::integer),0) after_dedupe,
    coalesce(sum((metadata #>> '{recipientAnalysis,storedNotifications}')::integer),0) stored_notifications,
    coalesce(sum((metadata #>> '{preferenceAnalysis,inputCount}')::integer),0) preference_input,
    coalesce(sum((metadata #>> '{preferenceAnalysis,skippedCount}')::integer),0) preference_skipped,
    coalesce(sum((metadata #>> '{preferenceAnalysis,outputCount}')::integer),0) preference_output FROM scoped
), top_errors AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object('errorClass', error_class, 'count', amount) ORDER BY amount DESC), '[]'::jsonb) value FROM (SELECT error_class, sum(GREATEST(failed_count, duplicate_count, 1)) amount FROM scoped WHERE error_class IS NOT NULL GROUP BY error_class ORDER BY amount DESC LIMIT 7) x
), active_types AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object('type', notification_type, 'count', successes, 'failures', failures, 'lastDelivery', last_delivery, 'errorRate', CASE WHEN successes + failures > 0 THEN failures::numeric / (successes + failures) ELSE 0 END) ORDER BY successes DESC), '[]'::jsonb) value FROM (SELECT notification_type, sum(successful_count) successes, sum(failed_count) failures, max(created_at) last_delivery FROM scoped GROUP BY notification_type ORDER BY successes DESC LIMIT 20) x
)
SELECT jsonb_build_object(
  'entries', coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'timestamp',created_at,'source','audit','type',notification_type,'status',status,'actorId',actor_user_id,'recipientId',recipient_user_id,'recipientCount',recipient_count,'afterDedupeCount',coalesce((metadata #>> '{recipientAnalysis,afterDedupe}')::integer,0),'actorRemovedCount',coalesce((metadata #>> '{recipientAnalysis,actorRemoved}')::integer,0),'successCount',successful_count,'failedCount',failed_count,'duplicateCount',duplicate_count,'skippedCount',skipped_count,'durationMs',duration_ms,'route',target_url,'errorClass',error_class,'resolver',resolver_source) ORDER BY created_at DESC) FROM filtered), '[]'::jsonb),
  'health', (SELECT jsonb_build_object('successful',successful,'failures',failures,'duplicates',duplicates,'skipped',skipped,'actorRemoved',actor_removed,'lastSuccess',last_success,'lastFailure',last_failure,'status',CASE WHEN failures > 0 THEN 'warning' ELSE 'success' END) FROM health),
  'recipientAnalysis', (SELECT jsonb_build_object('resolverInput',resolver_input,'foundTrainers',found_trainers,'activeTrainers',active_trainers,'adminProfiles',admin_profiles,'validAuthUsers',valid_auth_users,'afterActorFilter',after_actor_filter,'afterDedupe',after_dedupe,'storedNotifications',stored_notifications,'preferenceInput',preference_input,'preferenceSkipped',preference_skipped,'preferenceOutput',preference_output) FROM analysis),
  'topErrors', (SELECT value FROM top_errors), 'activeTypes', (SELECT value FROM active_types)
);
$$;

COMMIT;
