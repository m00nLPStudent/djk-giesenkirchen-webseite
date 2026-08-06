-- B15.18K proposal only. Deploy together with the RPC-based logger. Do not execute automatically.
BEGIN;

DROP POLICY IF EXISTS notification_audit_insert_active_admin ON public.notification_audit;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.notification_audit FROM anon, authenticated;
-- Remove the B15.18I overload if it was ever installed; it was executable by authenticated.
DROP FUNCTION IF EXISTS public.append_notification_audit(text,text,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb);

CREATE OR REPLACE FUNCTION public.append_notification_audit(
  p_notification_type text,
  p_status text,
  p_actor_user_id uuid,
  p_recipient_user_id uuid,
  p_recipient_count integer,
  p_successful_count integer,
  p_failed_count integer,
  p_duplicate_count integer,
  p_skipped_count integer,
  p_duration_ms integer,
  p_target_url text,
  p_resolver_source text,
  p_error_class text,
  p_idempotency_key text,
  p_metadata jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_id uuid;
  safe_actor uuid;
  safe_recipient uuid;
  safe_status text;
  safe_error_class text;
  source_metadata jsonb := CASE WHEN jsonb_typeof(p_metadata) = 'object' THEN p_metadata ELSE '{}'::jsonb END;
  recipient_analysis jsonb;
  preference_analysis jsonb;
  dispatcher_analysis jsonb;
  bounded_recipient_count integer := least(greatest(coalesce(p_recipient_count, 0), 0), 10000);
  bounded_successful_count integer := least(greatest(coalesce(p_successful_count, 0), 0), 10000);
  bounded_failed_count integer := least(greatest(coalesce(p_failed_count, 0), 0), 10000);
  bounded_duplicate_count integer := least(greatest(coalesce(p_duplicate_count, 0), 0), 10000);
  bounded_skipped_count integer := least(greatest(coalesce(p_skipped_count, 0), 0), 10000);
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'notification audit append is server-only' USING ERRCODE = '42501';
  END IF;

  safe_status := CASE
    WHEN p_status IN ('success', 'warning', 'failed', 'duplicate', 'skipped', 'actor_removed') THEN p_status
    ELSE 'warning'
  END;

  safe_error_class := CASE
    WHEN p_error_class IS NULL THEN NULL
    WHEN p_error_class IN (
      'notification_insert_failed', 'notification_preference_lookup_failed',
      'idempotency_lookup_failed', 'idempotency_duplicate', 'admin_client_unavailable',
      'finance_recipient_resolution_failed', 'contribution_batch_load_failed',
      'trainer_recipient_resolution_failed', 'dispatcher_failed'
    ) THEN p_error_class
    ELSE 'dispatcher_failed'
  END;

  SELECT p.id INTO safe_actor FROM public.admin_profiles p
  WHERE p.id = p_actor_user_id AND p.is_active = true;
  SELECT p.id INTO safe_recipient FROM public.admin_profiles p
  WHERE p.id = p_recipient_user_id AND p.is_active = true;

  recipient_analysis := jsonb_build_object(
    'resolverInput', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,resolverInput}')::integer, 0), 0), 10000),
    'foundTrainers', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,foundTrainers}')::integer, 0), 0), 10000),
    'activeTrainers', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,activeTrainers}')::integer, 0), 0), 10000),
    'adminProfiles', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,adminProfiles}')::integer, 0), 0), 10000),
    'validAuthUsers', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,validAuthUsers}')::integer, 0), 0), 10000),
    'afterActorFilter', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,afterActorFilter}')::integer, 0), 0), 10000),
    'afterDedupe', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,afterDedupe}')::integer, 0), 0), 10000),
    'storedNotifications', bounded_successful_count,
    'actorRemoved', least(greatest(coalesce((source_metadata #>> '{recipientAnalysis,actorRemoved}')::integer, 0), 0), 10000)
  );
  preference_analysis := jsonb_build_object(
    'inputCount', least(greatest(coalesce((source_metadata #>> '{preferenceAnalysis,inputCount}')::integer, 0), 0), 10000),
    'skippedCount', least(greatest(coalesce((source_metadata #>> '{preferenceAnalysis,skippedCount}')::integer, 0), 0), 10000),
    'outputCount', least(greatest(coalesce((source_metadata #>> '{preferenceAnalysis,outputCount}')::integer, 0), 0), 10000),
    'mandatoryType', coalesce((source_metadata #>> '{preferenceAnalysis,mandatoryType}')::boolean, false)
  );
  dispatcher_analysis := jsonb_build_object(
    'runId', left(coalesce(source_metadata #>> '{dispatcherAnalysis,runId}', ''), 100),
    'businessDate', left(coalesce(source_metadata #>> '{dispatcherAnalysis,businessDate}', ''), 10),
    'timezone', left(coalesce(source_metadata #>> '{dispatcherAnalysis,timezone}', ''), 50),
    'scannedCount', least(greatest(coalesce((source_metadata #>> '{dispatcherAnalysis,scannedCount}')::integer, 0), 0), 100000),
    'eligibleCount', least(greatest(coalesce((source_metadata #>> '{dispatcherAnalysis,eligibleCount}')::integer, 0), 0), 100000),
    'excludedCounts', coalesce((SELECT jsonb_object_agg(left(key, 50), least(greatest(value::integer, 0), 100000)) FROM jsonb_each_text(coalesce(source_metadata #> '{dispatcherAnalysis,excludedCounts}', '{}'::jsonb)) WHERE value ~ '^[0-9]{1,6}$'), '{}'::jsonb),
    'stageCounts', coalesce((SELECT jsonb_object_agg(left(key, 50), least(greatest(value::integer, 0), 100000)) FROM jsonb_each_text(coalesce(source_metadata #> '{dispatcherAnalysis,stageCounts}', '{}'::jsonb)) WHERE value ~ '^[0-9]{1,6}$'), '{}'::jsonb)
  );

  INSERT INTO public.notification_audit (
    notification_type, status, actor_user_id, recipient_user_id, recipient_count,
    successful_count, failed_count, duplicate_count, skipped_count, duration_ms,
    target_url, resolver_source, error_class, idempotency_key, metadata,
    retry_count, last_retry_at, retry_allowed
  ) VALUES (
    left(coalesce(nullif(btrim(p_notification_type), ''), 'unknown'), 100), safe_status,
    safe_actor, safe_recipient, bounded_recipient_count, bounded_successful_count,
    bounded_failed_count, bounded_duplicate_count, bounded_skipped_count,
    least(greatest(coalesce(p_duration_ms, 0), 0), 3600000),
    CASE WHEN p_target_url ~ '^/admin(?:/|$)' AND p_target_url !~ '[[:cntrl:]]' THEN left(p_target_url, 500) ELSE '/admin/notifications' END,
    CASE WHEN p_resolver_source IN ('central-notification-service', 'scheduled-contribution-dispatcher') THEN p_resolver_source ELSE 'central-notification-service' END,
    safe_error_class, left(nullif(btrim(p_idempotency_key), ''), 300),
    jsonb_build_object('recipientAnalysis', recipient_analysis, 'preferenceAnalysis', preference_analysis)
      || CASE WHEN p_resolver_source = 'scheduled-contribution-dispatcher' THEN jsonb_build_object('dispatcherAnalysis', dispatcher_analysis) ELSE '{}'::jsonb END,
    0, NULL, false
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_notification_audit(text,text,uuid,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb) TO service_role;

COMMIT;
