-- Proposal only. Requires coordinated logger deployment. Do not execute automatically.
BEGIN;
DROP POLICY IF EXISTS notification_audit_insert_active_admin ON public.notification_audit;
REVOKE INSERT ON public.notification_audit FROM authenticated;

CREATE FUNCTION public.append_notification_audit(
  p_notification_type text, p_status text, p_recipient_user_id uuid,
  p_recipient_count integer, p_successful_count integer, p_failed_count integer,
  p_duplicate_count integer, p_skipped_count integer, p_duration_ms integer,
  p_target_url text, p_resolver_source text, p_error_class text,
  p_idempotency_key text, p_metadata jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_profiles p WHERE p.is_active=true AND (p.id=auth.uid() OR lower(p.email)=lower(auth.jwt()->>'email'))) THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO public.notification_audit(notification_type,status,actor_user_id,recipient_user_id,recipient_count,successful_count,failed_count,duplicate_count,skipped_count,duration_ms,target_url,resolver_source,error_class,idempotency_key,metadata,retry_count,retry_allowed)
  VALUES (left(coalesce(p_notification_type,'unknown'),100), CASE WHEN p_status IN ('success','warning','failed','duplicate','skipped','actor_removed') THEN p_status ELSE 'warning' END, auth.uid(),p_recipient_user_id,
    least(greatest(coalesce(p_recipient_count,0),0),10000),least(greatest(coalesce(p_successful_count,0),0),10000),least(greatest(coalesce(p_failed_count,0),0),10000),least(greatest(coalesce(p_duplicate_count,0),0),10000),least(greatest(coalesce(p_skipped_count,0),0),10000),least(greatest(coalesce(p_duration_ms,0),0),3600000),
    CASE WHEN p_target_url LIKE '/%' AND p_target_url NOT LIKE '//%' THEN left(p_target_url,500) ELSE '/admin/notifications' END,left(p_resolver_source,100),left(p_error_class,100),left(p_idempotency_key,300),
    jsonb_build_object('recipientAnalysis',coalesce(p_metadata->'recipientAnalysis','{}'::jsonb),'preferenceAnalysis',coalesce(p_metadata->'preferenceAnalysis','{}'::jsonb)),0,false)
  RETURNING id INTO new_id; RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.append_notification_audit(text,text,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.append_notification_audit(text,text,uuid,integer,integer,integer,integer,integer,integer,text,text,text,text,jsonb) TO authenticated;
COMMIT;
-- The logger must switch from direct table insert to this RPC in the same deploy.
