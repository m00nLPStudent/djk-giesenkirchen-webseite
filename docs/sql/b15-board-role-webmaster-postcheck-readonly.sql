-- B15 / Version 1.0.8: live postcheck for the organization-wide board role "Webmaster".
-- READ-ONLY: run manually after the proposal and return every result block.

-- BRWPC.01_WEBMASTER_ROLE
SELECT
  'BRWPC.01_WEBMASTER_ROLE' AS section,
  br.id,
  br.name_de,
  br.name_en,
  br.slug,
  br.is_active,
  br.sort_order,
  br.department_id,
  br.created_at
FROM public.board_roles AS br
WHERE br.slug = 'webmaster'
ORDER BY br.id;

-- BRWPC.02_ROLE_COUNTS_AND_SCOPE
SELECT
  'BRWPC.02_ROLE_COUNTS_AND_SCOPE' AS section,
  count(*) AS total_role_count,
  count(*) FILTER (WHERE department_id IS NULL) AS organization_wide_count,
  count(*) FILTER (WHERE department_id IS NOT NULL) AS department_role_count,
  count(*) FILTER (WHERE is_active = true) AS active_count,
  count(*) FILTER (WHERE is_active = false) AS inactive_count,
  count(DISTINCT slug) AS distinct_slug_count
FROM public.board_roles;

-- BRWPC.03_DUPLICATE_SLUGS
SELECT
  'BRWPC.03_DUPLICATE_SLUGS' AS section,
  br.slug,
  count(*) AS occurrence_count
FROM public.board_roles AS br
GROUP BY br.slug
HAVING count(*) > 1
ORDER BY br.slug;

-- BRWPC.04_TECHNICAL_ADMIN_ROLE
SELECT
  'BRWPC.04_TECHNICAL_ADMIN_ROLE' AS section,
  ar.id,
  ar.key,
  ar.name,
  ar.description,
  ar.sort_order,
  ar.is_active
FROM public.admin_roles AS ar
WHERE ar.key = 'webmaster'
ORDER BY ar.id;

-- BRWPC.05_NEW_ROLE_USAGE
WITH webmaster_role AS MATERIALIZED (
  SELECT id FROM public.board_roles WHERE slug = 'webmaster'
)
SELECT
  'BRWPC.05_NEW_ROLE_USAGE' AS section,
  (SELECT count(*)
   FROM public.board_members AS bm
   JOIN webmaster_role AS wr ON wr.id = bm.role_id) AS board_member_assignment_count,
  (SELECT count(*)
   FROM public.board_role_responsibilities AS brr
   JOIN webmaster_role AS wr ON wr.id = brr.role_id) AS responsibility_configuration_count;

-- BRWPC.06_SCOPE_DISTRIBUTION
SELECT
  'BRWPC.06_SCOPE_DISTRIBUTION' AS section,
  coalesce(d.slug, 'organization_wide') AS role_scope,
  count(*) AS role_count,
  count(*) FILTER (WHERE br.is_active = true) AS active_role_count
FROM public.board_roles AS br
LEFT JOIN public.departments AS d ON d.id = br.department_id
GROUP BY coalesce(d.slug, 'organization_wide')
ORDER BY role_scope;

-- BRWPC.07_SORT_ORDER_NEIGHBORHOOD
SELECT
  'BRWPC.07_SORT_ORDER_NEIGHBORHOOD' AS section,
  br.slug,
  br.name_de,
  br.name_en,
  br.sort_order,
  br.is_active,
  br.department_id
FROM public.board_roles AS br
WHERE br.department_id IS NULL
  AND br.sort_order BETWEEN 130 AND 180
ORDER BY br.sort_order, br.slug;

-- BRWPC.08_CLOSURE
SELECT
  'BRWPC.08_CLOSURE' AS section,
  (SELECT count(*) FROM public.board_roles WHERE slug = 'webmaster') = 1
    AS exactly_one_webmaster_role,
  EXISTS (
    SELECT 1
    FROM public.board_roles
    WHERE slug = 'webmaster'
      AND name_de = 'Webmaster'
      AND name_en = 'Webmaster'
      AND is_active = true
      AND sort_order = 150
      AND department_id IS NULL
  ) AS webmaster_values_ok,
  (SELECT count(*) FROM public.board_roles) = 20 AS total_role_count_ok,
  (SELECT count(*) FROM public.board_roles WHERE department_id IS NULL) = 13
    AS organization_wide_count_ok,
  (SELECT count(*) FROM public.board_roles WHERE department_id IS NOT NULL) = 7
    AS department_role_count_ok,
  (SELECT count(DISTINCT slug) FROM public.board_roles) = 20
    AS no_duplicate_slugs,
  (SELECT count(*) FROM public.board_roles WHERE is_active IS DISTINCT FROM true) = 0
    AS all_roles_still_active,
  (SELECT count(*) FROM public.admin_roles WHERE key = 'webmaster') = 1
    AS technical_admin_role_still_present,
  NOT EXISTS (
    SELECT 1
    FROM public.board_roles AS br
    JOIN public.departments AS d ON d.id = br.department_id
    WHERE d.slug = 'fussball'
      AND br.slug NOT IN (
        'abteilungsleiter-fussball',
        'jugendleiter',
        'jugendkoordinator',
        'sportlicher-leiter',
        'stellvertretender-abteilungsleiter',
        'materialwart',
        'schiedsrichterobmann'
      )
  ) AS football_scope_unchanged,
  (SELECT count(*)
   FROM public.board_roles AS br
   JOIN public.departments AS d ON d.id = br.department_id
   WHERE d.slug = 'fussball') = 7 AS football_department_role_count_ok,
  NOT EXISTS (
    SELECT 1
    FROM public.board_roles AS br
    JOIN public.departments AS d ON d.id = br.department_id
    WHERE d.slug <> 'fussball'
  ) AS no_unexpected_department_role_scope,
  NOT EXISTS (
    SELECT 1
    FROM public.board_roles AS br
    LEFT JOIN public.departments AS d ON d.id = br.department_id
    WHERE br.department_id IS NOT NULL
      AND d.id IS NULL
  ) AS no_broken_department_scope;
