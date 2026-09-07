-- B15.24I - Behindertensport Contract Inventory: Live-Preflight
-- Ausschliesslich manuell im Supabase SQL Editor ausfuehren.
-- READ-ONLY: nur SELECT und WITH; keine personenbezogenen Nutzdaten.

-- I1.01_RELEVANT_RELATIONS
WITH expected(table_name) AS MATERIALIZED (
  VALUES
    ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions')
)
SELECT 'I1.01_RELEVANT_RELATIONS' AS section, e.table_name,
       n.nspname AS actual_schema, c.relname AS actual_relation, c.relkind,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM expected e
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  AND c.relname = e.table_name AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY e.table_name;

-- I1.02_TARGET_DEPARTMENTS (technische IDs, keine Personendaten)
SELECT 'I1.02_TARGET_DEPARTMENTS' AS section, d.id,
       to_jsonb(d)->>'slug' AS slug,
       COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name') AS display_name,
       to_jsonb(d)->>'is_active' AS is_active,
       COALESCE(to_jsonb(d)->>'sort_order', to_jsonb(d)->>'position') AS sort_order
FROM public.departments d
WHERE lower(COALESCE(to_jsonb(d)->>'slug', '')) IN
  ('behindertensport', 'disabled-sports', 'inclusive-sports',
   'gymnastikdamen', 'damen-gymnastik', 'womens-gymnastics')
   OR lower(COALESCE(to_jsonb(d)->>'name_de', to_jsonb(d)->>'name', ''))
      SIMILAR TO '%(behinderten|inklusiv|gymnastik)%'
ORDER BY COALESCE(to_jsonb(d)->>'slug', ''), d.id::text;

-- I1.03_RELEVANT_COLUMNS
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times'),
    ('admin_roles'), ('admin_permissions'), ('admin_role_permissions')
)
SELECT 'I1.03_RELEVANT_COLUMNS' AS section, c.table_name,
       c.ordinal_position, c.column_name, c.data_type, c.udt_schema,
       c.udt_name, c.is_nullable, c.column_default
FROM information_schema.columns c
JOIN relevant r ON r.table_name = c.table_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- I1.04_CONSTRAINTS_AND_FOREIGN_KEYS
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times')
)
SELECT 'I1.04_CONSTRAINTS_AND_FOREIGN_KEYS' AS section,
       rel.relname AS table_name, con.conname AS constraint_name,
       CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
         WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUSION'
         ELSE con.contype::text END AS constraint_type,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition,
       ref_ns.nspname AS referenced_schema, ref_rel.relname AS referenced_table,
       con.convalidated
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
JOIN pg_catalog.pg_namespace ns ON ns.oid = rel.relnamespace
JOIN relevant r ON r.table_name = rel.relname
LEFT JOIN pg_catalog.pg_class ref_rel ON ref_rel.oid = con.confrelid
LEFT JOIN pg_catalog.pg_namespace ref_ns ON ref_ns.oid = ref_rel.relnamespace
WHERE ns.nspname = 'public'
ORDER BY rel.relname, constraint_type, con.conname;

-- I1.05_INDEXES
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'),
    ('media_assets'), ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times')
)
SELECT 'I1.05_INDEXES' AS section, i.tablename, i.indexname, i.indexdef
FROM pg_catalog.pg_indexes i
JOIN relevant r ON r.table_name = i.tablename
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- I1.06_POLICIES
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times')
)
SELECT 'I1.06_POLICIES' AS section, p.tablename, p.policyname,
       p.permissive, p.roles, p.cmd, p.qual, p.with_check
FROM pg_catalog.pg_policies p
JOIN relevant r ON r.table_name = p.tablename
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.cmd, p.policyname;

-- I1.07_EFFECTIVE_TABLE_PRIVILEGES
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times')
), api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
), privileges(privilege_type) AS MATERIALIZED (
  VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'),
         ('REFERENCES'), ('TRIGGER')
)
SELECT 'I1.07_EFFECTIVE_TABLE_PRIVILEGES' AS section,
       r.table_name, ar.role_name, privilege.privilege_type,
       pg_catalog.has_table_privilege(
         ar.role_name, format('%I.%I', 'public', r.table_name), privilege.privilege_type
       ) AS effective_privilege
FROM relevant r
JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  AND c.relname = r.table_name AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
CROSS JOIN api_roles ar
CROSS JOIN privileges privilege
ORDER BY r.table_name, ar.role_name, privilege.privilege_type;

-- I1.08_COLUMN_PRIVILEGES
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('departments'), ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('club_closure_periods'),
    ('team_seasons'), ('teams'), ('events'),
    ('department_sections'), ('department_training_times'),
    ('activity_sections'), ('activity_training_times')
)
SELECT 'I1.08_COLUMN_PRIVILEGES' AS section, cp.table_name,
       cp.column_name, cp.grantee, cp.privilege_type, cp.is_grantable
FROM information_schema.column_privileges cp
JOIN relevant r ON r.table_name = cp.table_name
WHERE cp.table_schema = 'public'
  AND cp.grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY cp.table_name, cp.grantee, cp.column_name, cp.privilege_type;

-- I1.09_CONTENT_CANDIDATE_COUNTS (keine Inhalte)
SELECT 'I1.09_CONTENT_CANDIDATE_COUNTS' AS section,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(p)->>'slug', ''))
         SIMILAR TO '%(behinderten|disabled|inklusiv)%') AS disabled_sports_pages,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(p)->>'slug', ''))
         SIMILAR TO '%(gymnastik|gymnastics)%') AS gymnastics_pages,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(p)->>'slug', ''))
         SIMILAR TO '%(behinderten|disabled|inklusiv)%'
         AND COALESCE((to_jsonb(p)->>'is_published')::boolean, false))
         AS published_disabled_sports_pages
FROM public.pages p;

-- I1.10_CONTACT_CANDIDATE_COUNTS (keine Namen/Kontaktdaten)
SELECT 'I1.10_CONTACT_CANDIDATE_COUNTS' AS section,
       count(*) AS total_contacts,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(c)->>'category', ''))
         SIMILAR TO '%(behinderten|disabled|inklusiv)%') AS disabled_sports_candidates,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(c)->>'category', ''))
         SIMILAR TO '%(gymnastik|gymnastics)%') AS gymnastics_candidates,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(c)->>'category', ''))
         SIMILAR TO '%(behinderten|disabled|inklusiv)%'
         AND COALESCE((to_jsonb(c)->>'is_active')::boolean, false)
         AND COALESCE((to_jsonb(c)->>'is_public')::boolean, false))
         AS active_public_disabled_sports_candidates
FROM public.club_contacts c;

-- I1.11_TRAINING_BINDING_COUNTS
SELECT 'I1.11_TRAINING_BINDING_COUNTS' AS section,
       count(*) AS total_training_times,
       count(*) FILTER (WHERE ttt.team_season_id IS NULL) AS without_team_season,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(d)->>'slug', ''))
         IN ('behindertensport', 'disabled-sports', 'inclusive-sports'))
         AS disabled_sports_via_team,
       count(*) FILTER (WHERE lower(COALESCE(to_jsonb(d)->>'slug', ''))
         IN ('gymnastikdamen', 'damen-gymnastik', 'womens-gymnastics'))
         AS gymnastics_via_team
FROM public.team_training_times ttt
LEFT JOIN public.team_seasons ts ON ts.id = ttt.team_season_id
LEFT JOIN public.teams t ON t.id = ts.team_id
LEFT JOIN public.departments d ON d.id = t.department_id;

-- I1.12_MEDIA_USAGE_SHAPE (nur aggregierte technische Klassifikation)
SELECT 'I1.12_MEDIA_USAGE_SHAPE' AS section,
       COALESCE(to_jsonb(mau)->>'entity_type', '<null>') AS entity_type,
       COALESCE(to_jsonb(mau)->>'field_name', '<null>') AS field_name,
       count(*) AS usage_count
FROM public.media_asset_usages mau
GROUP BY COALESCE(to_jsonb(mau)->>'entity_type', '<null>'),
         COALESCE(to_jsonb(mau)->>'field_name', '<null>')
ORDER BY entity_type, field_name;

-- I1.13_MEDIA_VISIBILITY_COUNTS
SELECT 'I1.13_MEDIA_VISIBILITY_COUNTS' AS section,
       COALESCE(to_jsonb(ma)->>'media_kind', '<null>') AS media_kind,
       COALESCE(to_jsonb(ma)->>'visibility', '<null>') AS visibility,
       COALESCE((to_jsonb(ma)->>'is_archived')::boolean, false) AS is_archived,
       count(*) AS asset_count
FROM public.media_assets ma
GROUP BY COALESCE(to_jsonb(ma)->>'media_kind', '<null>'),
         COALESCE(to_jsonb(ma)->>'visibility', '<null>'),
         COALESCE((to_jsonb(ma)->>'is_archived')::boolean, false)
ORDER BY media_kind, visibility, is_archived;

-- I1.14_RELEVANT_PERMISSION_KEYS
SELECT 'I1.14_RELEVANT_PERMISSION_KEYS' AS section, p.id, p.key,
       to_jsonb(p)->>'name_de' AS name_de,
       to_jsonb(p)->>'is_active' AS is_active
FROM public.admin_permissions p
WHERE p.key IN ('settings.view', 'settings.edit',
  'department_sections.view', 'department_sections.edit',
  'activity_sections.view', 'activity_sections.edit')
   OR p.key SIMILAR TO '%(behinderten|disabled|section|activity)%'
ORDER BY p.key;

-- I1.15_ROLE_PERMISSION_MATRIX
WITH target_roles(role_key) AS MATERIALIZED (
  VALUES ('superadmin'), ('vorstand'), ('fussball-vorstand'),
    ('tischtennis-vorstand'), ('trainer'), ('betreuer'),
    ('kassierer'), ('webmaster'), ('behindertensport-vorstand'),
    ('damen-gymnastik-vorstand')
), target_permissions(permission_key) AS MATERIALIZED (
  VALUES ('settings.view'), ('settings.edit'),
    ('department_sections.view'), ('department_sections.edit'),
    ('activity_sections.view'), ('activity_sections.edit')
)
SELECT 'I1.15_ROLE_PERMISSION_MATRIX' AS section,
       tr.role_key, tp.permission_key,
       r.id IS NOT NULL AS role_exists,
       p.id IS NOT NULL AS permission_exists,
       EXISTS (
         SELECT 1 FROM public.admin_role_permissions rp
         WHERE rp.role_id = r.id AND rp.permission_id = p.id
       ) AS assigned
FROM target_roles tr
CROSS JOIN target_permissions tp
LEFT JOIN public.admin_roles r ON r.key = tr.role_key
LEFT JOIN public.admin_permissions p ON p.key = tp.permission_key
ORDER BY tr.role_key, tp.permission_key;

-- I1.16_TRIGGERS
WITH relevant(table_name) AS MATERIALIZED (
  VALUES ('pages'), ('club_contacts'), ('media_assets'),
    ('media_asset_usages'), ('team_training_times'),
    ('team_training_exceptions'), ('department_sections'),
    ('department_training_times'), ('activity_sections'),
    ('activity_training_times')
)
SELECT 'I1.16_TRIGGERS' AS section, rel.relname AS table_name,
       trg.tgname AS trigger_name, trg.tgenabled,
       pg_catalog.pg_get_triggerdef(trg.oid, true) AS trigger_definition,
       proc.oid::regprocedure::text AS function_signature
FROM pg_catalog.pg_trigger trg
JOIN pg_catalog.pg_class rel ON rel.oid = trg.tgrelid
JOIN pg_catalog.pg_namespace ns ON ns.oid = rel.relnamespace
JOIN relevant r ON r.table_name = rel.relname
JOIN pg_catalog.pg_proc proc ON proc.oid = trg.tgfoid
WHERE ns.nspname = 'public' AND NOT trg.tgisinternal
ORDER BY rel.relname, trg.tgname;

-- I1.17_RELEVANT_ROUTINES
-- MATERIALIZED filter prevents pg_get_functiondef on aggregates/window funcs.
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prokind, p.prosecdef, p.proconfig, p.proowner,
         n.nspname AS routine_schema, p.proname
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), definitions AS MATERIALIZED (
  SELECT e.*, pg_catalog.pg_get_functiondef(e.oid) AS definition
  FROM eligible e
)
SELECT 'I1.17_RELEVANT_ROUTINES' AS section,
       d.oid::regprocedure::text AS exact_signature,
       d.routine_schema, d.proname, d.prokind,
       d.prosecdef AS security_definer, d.proconfig,
       pg_catalog.pg_get_userbyid(d.proowner) AS owner, d.definition
FROM definitions d
WHERE d.definition ILIKE ANY (ARRAY[
  '%pages%', '%club_contacts%', '%media_assets%', '%media_asset_usages%',
  '%team_training_times%', '%team_training_exceptions%', '%departments%',
  '%department_sections%', '%department_training_times%',
  '%activity_sections%', '%activity_training_times%'
])
ORDER BY d.oid::regprocedure::text;

-- I1.18_RELEVANT_ROUTINE_EXECUTE
WITH eligible AS MATERIALIZED (
  SELECT p.oid, p.prokind
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
), definitions AS MATERIALIZED (
  SELECT e.oid, pg_catalog.pg_get_functiondef(e.oid) AS definition
  FROM eligible e
), relevant AS MATERIALIZED (
  SELECT d.oid FROM definitions d
  WHERE d.definition ILIKE ANY (ARRAY[
    '%pages%', '%club_contacts%', '%media_assets%', '%media_asset_usages%',
    '%team_training_times%', '%team_training_exceptions%', '%departments%',
    '%department_sections%', '%department_training_times%',
    '%activity_sections%', '%activity_training_times%'
  ])
), api_roles(role_name) AS MATERIALIZED (
  VALUES ('anon'), ('authenticated'), ('service_role')
)
SELECT 'I1.18_RELEVANT_ROUTINE_EXECUTE' AS section,
       r.oid::regprocedure::text AS exact_signature, ar.role_name,
       pg_catalog.has_function_privilege(ar.role_name, r.oid, 'EXECUTE')
         AS effective_execute
FROM relevant r CROSS JOIN api_roles ar
ORDER BY r.oid::regprocedure::text, ar.role_name;
