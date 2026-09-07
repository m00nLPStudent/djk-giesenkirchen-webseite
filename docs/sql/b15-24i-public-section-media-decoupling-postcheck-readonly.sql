-- B15.24I I.5F3 - Public Section / Media decoupling postcheck
-- READ-ONLY. Erst nach manueller Proposal-Ausfuehrung verwenden.

-- I5F3.01_SECTION_POLICY
SELECT 'I5F3.01_SECTION_POLICY' AS section,
       policyname, roles, cmd, qual, with_check,
       qual ILIKE '%d.id = department_sections.department_id%' AS department_correlated,
       qual ILIKE '%media_assets%' AS reads_media_assets
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'department_sections'
  AND policyname = 'department_sections_public_read';

-- I5F3.02_TRAINING_POLICY
-- Protected-row fields are rendered unqualified by pg_get_expr; the two
-- outer-row correlations remain explicitly qualified and are checked below.
SELECT 'I5F3.02_TRAINING_POLICY' AS section,
       policyname, roles, cmd, qual, with_check,
       qual ILIKE ALL (ARRAY[
         '%department_training_times.department_id%',
         '%department_sections%', '%departments%',
         '%effective_from%', '%effective_until%', '%is_active%', '%is_published%'
       ])
         AND (
           length(lower(qual))
           - length(replace(lower(qual), 'department_training_times.department_id', ''))
         ) / length('department_training_times.department_id') >= 2
         AND qual ~* '[[:alnum:]_]+\.id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
         AND qual ~* '[[:alnum:]_]+\.department_id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
         AS row_department_correlated,
       qual ILIKE '%media_assets%' AS directly_reads_media_assets
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'department_training_times'
  AND policyname = 'department_training_times_public_read';

-- I5F3.03_MEDIA_POLICY
SELECT 'I5F3.03_MEDIA_POLICY' AS section,
       policyname, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public' AND tablename = 'media_assets'
ORDER BY policyname;

-- I5F3.04_TABLE_PRIVILEGES
WITH roles(role_name) AS (VALUES ('anon'), ('authenticated'), ('service_role')),
targets(relation_name) AS (
  VALUES ('department_sections'), ('department_training_times'), ('departments'), ('media_assets')
)
SELECT 'I5F3.04_TABLE_PRIVILEGES' AS section,
       r.role_name, t.relation_name,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'SELECT') AS can_select,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'INSERT') AS can_insert,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'UPDATE') AS can_update,
       pg_catalog.has_table_privilege(r.role_name, 'public.' || t.relation_name, 'DELETE') AS can_delete
FROM roles r CROSS JOIN targets t
ORDER BY r.role_name, t.relation_name;

-- I5F3.05_SECTION_MEDIA_DEPENDENCY
WITH section_policy AS MATERIALIZED (
  SELECT qual FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_sections'
    AND policyname = 'department_sections_public_read'
), eligible AS MATERIALIZED (
  SELECT p.oid
  FROM pg_catalog.pg_proc p
  WHERE p.prokind = 'f'
    AND p.oid = to_regprocedure('public.get_public_department_section(text)')
), definition AS MATERIALIZED (
  SELECT pg_catalog.pg_get_functiondef(oid) AS body FROM eligible
)
SELECT 'I5F3.05_SECTION_MEDIA_DEPENDENCY' AS section,
       (SELECT count(*) = 1 FROM section_policy) AS section_policy_exists,
       (SELECT COALESCE(bool_and(qual NOT ILIKE '%media_assets%'), false) FROM section_policy)
         AS policy_decoupled_from_media,
       (SELECT count(*) = 1 FROM definition) AS public_function_exists,
       (SELECT COALESCE(bool_and(body NOT ILIKE '%media_assets%'), false) FROM definition)
         AS public_function_decoupled_from_media;

-- I5F3.06_PUBLIC_SECTION_STATE
SELECT 'I5F3.06_PUBLIC_SECTION_STATE' AS section,
       count(*) FILTER (WHERE d.slug = 'behindertensport') AS total_sections,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
       ) AS public_section_candidates,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND s.image_media_asset_id IS NULL
       ) AS candidates_without_image,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND s.image_media_asset_id IS NOT NULL
       ) AS candidates_with_image
FROM public.department_sections s
JOIN public.departments d ON d.id = s.department_id;

-- I5F3.07_PUBLIC_TRAINING_STATE
SELECT 'I5F3.07_PUBLIC_TRAINING_STATE' AS section,
       count(*) FILTER (WHERE d.slug = 'behindertensport') AS total_training_rows,
       count(*) FILTER (
         WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
           AND t.is_active
           AND (t.effective_from IS NULL OR t.effective_from <= CURRENT_DATE)
           AND (t.effective_until IS NULL OR t.effective_until >= CURRENT_DATE)
       ) AS public_training_candidates,
       bool_and(t.department_id = d.id AND s.department_id = t.department_id)
         FILTER (WHERE d.slug = 'behindertensport') AS all_rows_department_correlated
FROM public.department_training_times t
JOIN public.departments d ON d.id = t.department_id
LEFT JOIN public.department_sections s ON s.department_id = t.department_id;

-- I5F3.08_PUBLIC_FUNCTION_CONTRACT
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner, p.proacl
  FROM pg_catalog.pg_proc p
  WHERE p.prokind = 'f'
    AND p.oid = to_regprocedure('public.get_public_department_section(text)')
), definition AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS body FROM eligible e
)
SELECT 'I5F3.08_PUBLIC_FUNCTION_CONTRACT' AS section,
       d.oid::regprocedure::text AS exact_signature,
       d.prosecdef AS security_definer,
       d.proconfig,
       pg_catalog.pg_get_userbyid(d.proowner) AS owner,
       d.body,
       EXISTS (
         SELECT 1 FROM pg_catalog.aclexplode(
           COALESCE(d.proacl, pg_catalog.acldefault('f', d.proowner))
         ) acl WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
       ) AS public_execute,
       pg_catalog.has_function_privilege('anon', d.oid, 'EXECUTE') AS anon_execute,
       pg_catalog.has_function_privilege('authenticated', d.oid, 'EXECUTE') AS authenticated_execute,
       pg_catalog.has_function_privilege('service_role', d.oid, 'EXECUTE') AS service_role_execute,
       d.body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_name ELSE NULL END%'
         AND d.body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_email ELSE NULL END%'
         AND d.body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_phone ELSE NULL END%'
         AS contact_mask_intact
FROM definition d;

-- I5F3.09_FINAL_DIAGNOSTIC
WITH section_policy AS MATERIALIZED (
  SELECT roles, cmd, qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_sections'
    AND policyname = 'department_sections_public_read'
), training_policy AS MATERIALIZED (
  SELECT roles, cmd, qual
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public' AND tablename = 'department_training_times'
    AND policyname = 'department_training_times_public_read'
), eligible_function AS MATERIALIZED (
  SELECT p.oid, p.prosecdef, p.proconfig, p.proowner, p.proacl
  FROM pg_catalog.pg_proc p
  WHERE p.prokind = 'f'
    AND p.oid = to_regprocedure('public.get_public_department_section(text)')
), function_contract AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS body
  FROM eligible_function e
), candidates AS MATERIALIZED (
  SELECT
    EXISTS (
      SELECT 1 FROM public.department_sections s
      JOIN public.departments d ON d.id = s.department_id
      WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
    ) AS section_exists,
    EXISTS (
      SELECT 1 FROM public.department_training_times t
      JOIN public.departments d ON d.id = t.department_id
      JOIN public.department_sections s ON s.department_id = t.department_id
      WHERE d.slug = 'behindertensport' AND d.is_active AND s.is_active AND s.is_published
        AND t.is_active
        AND (t.effective_from IS NULL OR t.effective_from <= CURRENT_DATE)
        AND (t.effective_until IS NULL OR t.effective_until >= CURRENT_DATE)
    ) AS training_exists
)
SELECT 'I5F3.09_FINAL_DIAGNOSTIC' AS section,
       (SELECT count(*) = 1 FROM section_policy) AS section_policy_exists,
       (SELECT count(*) = 1 AND bool_and(
          cmd = 'SELECT'
          AND roles @> ARRAY['anon','authenticated']::name[] AND cardinality(roles) = 2
          AND qual ILIKE '%d.id = department_sections.department_id%'
          AND qual ILIKE '%d.is_active%'
        ) FROM section_policy) AS section_policy_department_correlated,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AS section_policy_reads_media_assets,
       (SELECT count(*) = 1 FROM training_policy) AS training_policy_exists,
       (SELECT count(*) = 1 AND bool_and(
          qual ILIKE ALL (ARRAY[
            '%department_training_times.department_id%',
            '%department_sections%', '%departments%',
            '%effective_from%', '%effective_until%', '%is_active%', '%is_published%'
          ])
          AND (
            length(lower(qual))
            - length(replace(lower(qual), 'department_training_times.department_id', ''))
          ) / length('department_training_times.department_id') >= 2
          AND qual ~* '[[:alnum:]_]+\.id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
          AND qual ~* '[[:alnum:]_]+\.department_id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
        ) FROM training_policy) AS training_policy_correlated,
       pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
         AS anon_has_media_assets_select,
       pg_catalog.has_table_privilege('authenticated', 'public.media_assets', 'SELECT')
         AS authenticated_has_media_assets_select,
       (SELECT count(*) <> 1 OR bool_or(qual ILIKE '%media_assets%') FROM section_policy)
         AS public_section_requires_media_table_access,
       (SELECT count(*) = 1 AND bool_and(qual ILIKE '%department_sections%') FROM training_policy)
         AND (SELECT count(*) = 1 AND bool_and(qual ILIKE '%media_assets%') FROM section_policy)
         AS public_training_transitively_requires_media_table_access,
       (SELECT section_exists FROM candidates) AS public_section_candidate_exists,
       (SELECT training_exists FROM candidates) AS public_training_candidate_exists,
       (SELECT count(*) = 1 FROM function_contract) AS contact_rpc_exists,
       (SELECT count(*) = 1 AND bool_and(prosecdef) FROM function_contract)
         AS contact_rpc_security_definer,
       pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
         AS raw_media_grant_added,
       (SELECT count(*) = 1 AND bool_and(
          cmd = 'SELECT'
          AND roles @> ARRAY['anon','authenticated']::name[] AND cardinality(roles) = 2
          AND qual ILIKE '%d.id = department_sections.department_id%'
          AND qual NOT ILIKE '%media_assets%'
        ) FROM section_policy)
       AND (SELECT count(*) = 1 AND bool_and(
          qual ILIKE ALL (ARRAY[
            '%department_training_times.department_id%',
            '%department_sections%', '%departments%',
            '%effective_from%', '%effective_until%', '%is_active%', '%is_published%'
          ])
          AND (
            length(lower(qual))
            - length(replace(lower(qual), 'department_training_times.department_id', ''))
          ) / length('department_training_times.department_id') >= 2
          AND qual ~* '[[:alnum:]_]+\.id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
          AND qual ~* '[[:alnum:]_]+\.department_id[[:space:]]*=[[:space:]]*department_training_times\.department_id'
        ) FROM training_policy)
       AND NOT pg_catalog.has_table_privilege('anon', 'public.media_assets', 'SELECT')
       AND (SELECT count(*) = 1 AND bool_and(
          prosecdef AND proconfig = ARRAY['search_path=pg_catalog']
          AND body NOT ILIKE '%media_assets%'
          AND body ILIKE '%CASE WHEN s.contact_is_public IS TRUE THEN s.contact_name ELSE NULL END%'
        ) FROM function_contract)
         AS expected_security_state;
