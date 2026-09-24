-- B15 - Productive Supabase security hardening
-- Phase 2: MANUAL EXECUTION ONLY after review and approval.
-- No business rows are inserted, updated or deleted.

BEGIN;

DO $guard$
DECLARE
  v_table text;
  v_expected_rls boolean;
  v_expected_policy_count integer;
BEGIN
  IF to_regprocedure('public.current_admin_has_permission(text)') IS NULL THEN
    RAISE EXCEPTION 'Required permission helper is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc p
    WHERE p.oid = 'public.current_admin_has_permission(text)'::regprocedure
      AND p.prosecdef
      AND p.proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
  ) OR NOT pg_catalog.has_function_privilege(
    'authenticated',
    'public.current_admin_has_permission(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Permission helper security contract changed';
  END IF;

  IF to_regprocedure('public.enforce_news_publication_transition()') IS NOT NULL
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.pg_trigger trigger_row
       WHERE trigger_row.tgrelid = 'public.news'::regclass
         AND trigger_row.tgname = 'news_enforce_publication_transition'
         AND NOT trigger_row.tgisinternal
     ) THEN
    RAISE EXCEPTION 'News publication transition guard already exists; ownership review required';
  END IF;

  FOR v_table, v_expected_rls, v_expected_policy_count IN
    SELECT * FROM (VALUES
      ('club_settings', false, 4),
      ('membership_request_recipients', false, 4),
      ('pages', false, 4),
      ('events', true, 4),
      ('news', true, 4),
      ('news_documents', true, 7)
    ) baseline(table_name, rls_enabled, policy_count)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_table
        AND c.relkind IN ('r', 'p')
        AND c.relrowsecurity = v_expected_rls
        AND c.relforcerowsecurity = false
        AND (
          SELECT count(*) FROM pg_catalog.pg_policy pol
          WHERE pol.polrelid = c.oid
        ) = v_expected_policy_count
    ) THEN
      RAISE EXCEPTION 'Unexpected RLS/policy baseline for public.%', v_table;
    END IF;
  END LOOP;

  IF (
    SELECT count(*)
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND (
        (tablename = 'club_settings' AND policyname IN (
          'club_settings_delete_admin', 'club_settings_insert_admin',
          'club_settings_read_all', 'club_settings_update_admin'
        )) OR
        (tablename = 'membership_request_recipients' AND policyname IN (
          'membership_request_recipients_delete_admin',
          'membership_request_recipients_insert_admin',
          'membership_request_recipients_select_admin',
          'membership_request_recipients_update_admin'
        )) OR
        (tablename = 'pages' AND policyname IN (
          'pages_delete_dev', 'pages_insert_dev',
          'pages_read_published', 'pages_update_dev'
        )) OR
        (tablename = 'events' AND policyname IN (
          'events_admin_delete', 'events_admin_insert',
          'events_admin_update', 'events_public_read_published'
        )) OR
        (tablename = 'news' AND policyname IN (
          'Public can delete news', 'Public can insert news',
          'Public can read news', 'Public can update news'
        )) OR
        (tablename = 'news_documents' AND policyname IN (
          'Allow anon delete news documents',
          'Allow anon insert news documents',
          'Allow anon update news documents',
          'Allow authenticated delete news documents',
          'Allow authenticated insert news documents',
          'Allow authenticated update news documents',
          'Allow public read news documents'
        ))
      )
  ) <> 27 THEN
    RAISE EXCEPTION 'Expected policy-name baseline changed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('club_settings'), ('membership_request_recipients'), ('pages'),
      ('events'), ('news'), ('news_documents')
    ) target(table_name)
    CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) role_row(role_name)
    WHERE NOT (
      pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'SELECT')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'INSERT')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'UPDATE')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'DELETE')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'TRUNCATE')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'REFERENCES')
      AND pg_catalog.has_table_privilege(role_row.role_name, 'public.' || target.table_name, 'TRIGGER')
    )
  ) THEN
    RAISE EXCEPTION 'Expected table-grant baseline changed';
  END IF;
END
$guard$;

-- Activate the three currently ineffective policy sets.
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_request_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Remove the legacy policies before installing the current permission model.
DROP POLICY club_settings_delete_admin ON public.club_settings;
DROP POLICY club_settings_insert_admin ON public.club_settings;
DROP POLICY club_settings_read_all ON public.club_settings;
DROP POLICY club_settings_update_admin ON public.club_settings;

DROP POLICY membership_request_recipients_delete_admin ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_insert_admin ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_select_admin ON public.membership_request_recipients;
DROP POLICY membership_request_recipients_update_admin ON public.membership_request_recipients;

DROP POLICY pages_delete_dev ON public.pages;
DROP POLICY pages_insert_dev ON public.pages;
DROP POLICY pages_read_published ON public.pages;
DROP POLICY pages_update_dev ON public.pages;

DROP POLICY events_admin_delete ON public.events;
DROP POLICY events_admin_insert ON public.events;
DROP POLICY events_admin_update ON public.events;
DROP POLICY events_public_read_published ON public.events;

DROP POLICY "Public can delete news" ON public.news;
DROP POLICY "Public can insert news" ON public.news;
DROP POLICY "Public can read news" ON public.news;
DROP POLICY "Public can update news" ON public.news;

DROP POLICY "Allow anon delete news documents" ON public.news_documents;
DROP POLICY "Allow anon insert news documents" ON public.news_documents;
DROP POLICY "Allow anon update news documents" ON public.news_documents;
DROP POLICY "Allow authenticated delete news documents" ON public.news_documents;
DROP POLICY "Allow authenticated insert news documents" ON public.news_documents;
DROP POLICY "Allow authenticated update news documents" ON public.news_documents;
DROP POLICY "Allow public read news documents" ON public.news_documents;

-- Public club data remains readable; writes require settings.edit.
CREATE POLICY club_settings_public_read
  ON public.club_settings FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY club_settings_insert_settings_edit
  ON public.club_settings FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_permission('settings.edit'));
CREATE POLICY club_settings_update_settings_edit
  ON public.club_settings FOR UPDATE TO authenticated
  USING (public.current_admin_has_permission('settings.edit'))
  WITH CHECK (public.current_admin_has_permission('settings.edit'));
CREATE POLICY club_settings_delete_settings_edit
  ON public.club_settings FOR DELETE TO authenticated
  USING (public.current_admin_has_permission('settings.edit'));

-- Routing configuration is never public and follows membership permissions.
CREATE POLICY membership_request_recipients_select_authorized
  ON public.membership_request_recipients FOR SELECT TO authenticated
  USING (public.current_admin_has_permission('membership_requests.view'));
CREATE POLICY membership_request_recipients_insert_authorized
  ON public.membership_request_recipients FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_permission('membership_requests.edit'));
CREATE POLICY membership_request_recipients_update_authorized
  ON public.membership_request_recipients FOR UPDATE TO authenticated
  USING (public.current_admin_has_permission('membership_requests.edit'))
  WITH CHECK (public.current_admin_has_permission('membership_requests.edit'));
CREATE POLICY membership_request_recipients_delete_authorized
  ON public.membership_request_recipients FOR DELETE TO authenticated
  USING (public.current_admin_has_permission('membership_requests.edit'));

-- Only published CMS pages are public; dashboard access uses settings permissions.
CREATE POLICY pages_public_read_published
  ON public.pages FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY pages_authenticated_read
  ON public.pages FOR SELECT TO authenticated
  USING (
    is_published = true
    OR public.current_admin_has_permission('settings.view')
    OR public.current_admin_has_permission('settings.edit')
  );
CREATE POLICY pages_insert_settings_edit
  ON public.pages FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_permission('settings.edit'));
CREATE POLICY pages_update_settings_edit
  ON public.pages FOR UPDATE TO authenticated
  USING (public.current_admin_has_permission('settings.edit'))
  WITH CHECK (public.current_admin_has_permission('settings.edit'));
CREATE POLICY pages_delete_settings_edit
  ON public.pages FOR DELETE TO authenticated
  USING (public.current_admin_has_permission('settings.edit'));

-- Event mutations are service-role/server-action only.
CREATE POLICY events_public_read_published
  ON public.events FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY events_authenticated_read
  ON public.events FOR SELECT TO authenticated
  USING (
    is_published = true
    OR public.current_admin_has_permission('events.view')
  );

-- Public news is publication-gated. Authenticated writes follow granular permissions.
CREATE POLICY news_public_read_published
  ON public.news FOR SELECT TO anon
  USING (
    is_published = true
    AND published_at IS NOT NULL
    AND published_at <= now()
  );
CREATE POLICY news_authenticated_read
  ON public.news FOR SELECT TO authenticated
  USING (
    (is_published = true AND published_at IS NOT NULL AND published_at <= now())
    OR public.current_admin_has_permission('news.view')
  );
CREATE POLICY news_insert_authorized
  ON public.news FOR INSERT TO authenticated
  WITH CHECK (
    public.current_admin_has_permission('news.create')
    AND (
      is_published = false
      OR public.current_admin_has_permission('news.publish')
    )
  );
CREATE POLICY news_update_authorized
  ON public.news FOR UPDATE TO authenticated
  USING (public.current_admin_has_permission('news.edit'))
  WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_delete_authorized
  ON public.news FOR DELETE TO authenticated
  USING (public.current_admin_has_permission('news.delete'));

-- RLS cannot compare OLD and NEW. Keep editorial updates available to news.edit,
-- while a transition-aware trigger protects publication state and schedule.
CREATE FUNCTION public.enforce_news_publication_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF auth.role() IS NOT DISTINCT FROM 'service_role' THEN
    RETURN NEW;
  END IF;

  IF (
    OLD.is_published IS DISTINCT FROM NEW.is_published
    OR (
      NEW.is_published = true
      AND OLD.published_at IS DISTINCT FROM NEW.published_at
    )
  ) AND NOT public.current_admin_has_permission('news.publish') THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Missing news.publish permission for publication transition';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_news_publication_transition()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_news_publication_transition()
TO service_role;

CREATE TRIGGER news_enforce_publication_transition
  BEFORE UPDATE OF is_published, published_at ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_news_publication_transition();

-- Public documents require both document and parent-news publication.
CREATE POLICY news_documents_public_read
  ON public.news_documents FOR SELECT TO anon
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.news parent_news
      WHERE parent_news.id = news_documents.news_id
        AND parent_news.is_published = true
        AND parent_news.published_at IS NOT NULL
        AND parent_news.published_at <= now()
    )
  );
CREATE POLICY news_documents_authenticated_read
  ON public.news_documents FOR SELECT TO authenticated
  USING (
    (
      is_public = true
      AND EXISTS (
        SELECT 1 FROM public.news parent_news
        WHERE parent_news.id = news_documents.news_id
          AND parent_news.is_published = true
          AND parent_news.published_at IS NOT NULL
          AND parent_news.published_at <= now()
      )
    )
    OR public.current_admin_has_permission('news.view')
  );
CREATE POLICY news_documents_insert_authorized
  ON public.news_documents FOR INSERT TO authenticated
  WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_documents_update_authorized
  ON public.news_documents FOR UPDATE TO authenticated
  USING (public.current_admin_has_permission('news.edit'))
  WITH CHECK (public.current_admin_has_permission('news.edit'));
CREATE POLICY news_documents_delete_authorized
  ON public.news_documents FOR DELETE TO authenticated
  USING (public.current_admin_has_permission('news.edit'));

-- Least-privilege table grants. RLS remains the row-level security boundary.
REVOKE ALL ON TABLE
  public.club_settings,
  public.membership_request_recipients,
  public.pages,
  public.events,
  public.news,
  public.news_documents
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.club_settings,
  public.pages,
  public.events,
  public.news,
  public.news_documents
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.club_settings,
  public.membership_request_recipients,
  public.pages,
  public.news,
  public.news_documents
TO authenticated;
GRANT SELECT ON TABLE public.events TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.club_settings,
  public.membership_request_recipients,
  public.pages,
  public.events,
  public.news,
  public.news_documents
TO service_role;

-- Harden the legacy superadmin helper without changing its boolean contract.
ALTER FUNCTION public.is_superadmin_actor()
  SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.is_superadmin_actor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin_actor() TO authenticated, service_role;

DO $post_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('club_settings'), ('membership_request_recipients'), ('pages'),
      ('events'), ('news'), ('news_documents')
    ) target(table_name)
    JOIN pg_catalog.pg_class c ON c.relname = target.table_name
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE c.relrowsecurity IS FALSE OR c.relforcerowsecurity IS TRUE
  ) THEN
    RAISE EXCEPTION 'RLS postcondition failed';
  END IF;

  IF pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'SELECT')
     OR pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'INSERT')
     OR pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'UPDATE')
     OR pg_catalog.has_table_privilege('anon', 'public.membership_request_recipients', 'DELETE')
     OR pg_catalog.has_table_privilege('anon', 'public.events', 'INSERT')
     OR pg_catalog.has_table_privilege('authenticated', 'public.events', 'INSERT') THEN
    RAISE EXCEPTION 'Least-privilege postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.aclexplode(COALESCE(
      (SELECT p.proacl FROM pg_catalog.pg_proc p
       WHERE p.oid = 'public.is_superadmin_actor()'::regprocedure),
      pg_catalog.acldefault('f', (
        SELECT p.proowner FROM pg_catalog.pg_proc p
        WHERE p.oid = 'public.is_superadmin_actor()'::regprocedure
      ))
    )) acl
    WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'PUBLIC EXECUTE postcondition failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger trigger_row
    JOIN pg_catalog.pg_proc function_row ON function_row.oid = trigger_row.tgfoid
    WHERE trigger_row.tgrelid = 'public.news'::regclass
      AND trigger_row.tgname = 'news_enforce_publication_transition'
      AND NOT trigger_row.tgisinternal
      AND function_row.oid = 'public.enforce_news_publication_transition()'::regprocedure
      AND function_row.prosecdef
      AND function_row.proconfig @> ARRAY['search_path=pg_catalog, public']::text[]
  ) THEN
    RAISE EXCEPTION 'News publication transition postcondition failed';
  END IF;
END
$post_guard$;

COMMIT;
