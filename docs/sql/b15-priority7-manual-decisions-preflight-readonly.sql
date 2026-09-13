-- PRIORITY 7 - MANUAL DECISION RESOLUTION
-- READ ONLY - DO NOT ADD DDL OR DML
-- Keep exports private. No names, contact values, audit identities/metadata,
-- object paths, credentials or binary data are returned.

-- P7D.01_CLUB_CONTACT_CLASSIFICATION
SELECT 'P7D.01_CLUB_CONTACT_CLASSIFICATION' AS section,
       category, is_active, is_public,
       (role_key IS NOT NULL AND btrim(role_key) <> '') AS has_role_key,
       (image_media_asset_id IS NOT NULL) AS has_media,
       count(*)::bigint AS row_count
FROM public.club_contacts
GROUP BY category, is_active, is_public, has_role_key, has_media
ORDER BY category, is_active DESC, is_public DESC, has_role_key DESC, has_media DESC;

-- P7D.02_DEPARTMENT_SECTIONS
SELECT 'P7D.02_DEPARTMENT_SECTIONS' AS section,
       d.slug AS department_slug, ds.is_active, ds.is_published,
       (ds.image_media_asset_id IS NOT NULL) AS has_media,
       (ds.contact_name IS NOT NULL OR ds.contact_email IS NOT NULL OR
        ds.contact_phone IS NOT NULL) AS has_contact,
       (length(coalesce(ds.description_de, '')) > 0) AS has_content,
       count(*)::bigint AS row_count
FROM public.department_sections ds
JOIN public.departments d ON d.id = ds.department_id
GROUP BY d.slug, ds.is_active, ds.is_published, has_media, has_contact,
         has_content
ORDER BY d.slug, ds.is_active DESC, ds.is_published DESC;

-- P7D.03_DEPARTMENT_TRAINING
SELECT 'P7D.03_DEPARTMENT_TRAINING' AS section,
       d.slug AS department_slug, dtt.is_active,
       (dtt.effective_from IS NOT NULL OR dtt.effective_until IS NOT NULL) AS is_date_bounded,
       (dtt.location_name IS NOT NULL OR dtt.location_address IS NOT NULL OR
        dtt.location_city IS NOT NULL) AS has_location,
       count(*)::bigint AS row_count
FROM public.department_training_times dtt
JOIN public.departments d ON d.id = dtt.department_id
GROUP BY d.slug, dtt.is_active, is_date_bounded, has_location
ORDER BY d.slug, dtt.is_active DESC, is_date_bounded DESC;

-- P7D.04_NOTIFICATION_AUDIT_CATEGORIES
SELECT 'P7D.04_NOTIFICATION_AUDIT_CATEGORIES' AS section,
       notification_type, status, resolver_source, error_class, retry_allowed,
       count(*)::bigint AS row_count,
       min(created_at) AS first_recorded_at,
       max(created_at) AS last_recorded_at
FROM public.notification_audit
GROUP BY notification_type, status, resolver_source, error_class, retry_allowed
ORDER BY notification_type, status, resolver_source, error_class, retry_allowed;

-- P7D.05_CLOSURE_PERIODS
WITH classified AS MATERIALIZED (
  SELECT to_jsonb(c) AS row_data
  FROM public.club_closure_periods c
)
SELECT 'P7D.05_CLOSURE_PERIODS' AS section,
       CASE
         WHEN nullif(row_data->>'team_season_id', '') IS NOT NULL THEN 'team_season'
         WHEN nullif(row_data->>'department_id', '') IS NOT NULL THEN 'department'
         ELSE 'club'
       END AS scope,
       coalesce((row_data->>'is_active')::boolean, true) AS is_active,
       count(*)::bigint AS row_count,
       min(coalesce(row_data->>'start_date', row_data->>'valid_from')) AS earliest_start,
       max(coalesce(row_data->>'end_date', row_data->>'valid_until')) AS latest_end
FROM classified
GROUP BY scope, is_active
ORDER BY scope, is_active DESC;

-- P7D.06_HISTORY_AND_PAGE_CONTENT
SELECT 'P7D.06_HISTORY_AND_PAGE_CONTENT' AS section, relation_name, row_count
FROM (VALUES
  ('club_history_pages', (SELECT count(*)::bigint FROM public.club_history_pages)),
  ('club_history_images', (SELECT count(*)::bigint FROM public.club_history_images)),
  ('club_history_milestones', (SELECT count(*)::bigint FROM public.club_history_milestones)),
  ('pages', (SELECT count(*)::bigint FROM public.pages))
) inventory(relation_name, row_count)
ORDER BY relation_name;

-- P7D.07_SEASONS_AND_REFERENCES
SELECT 'P7D.07_SEASONS_AND_REFERENCES' AS section,
       s.id AS season_id, s.slug, s.name, s.is_current, s.is_active,
       count(DISTINCT ts.id)::bigint AS team_season_references,
       count(DISTINCT pc.id)::bigint AS contribution_references
FROM public.seasons s
LEFT JOIN public.team_seasons ts ON ts.season_id = s.id
LEFT JOIN public.player_contributions pc ON pc.season_id = s.id
GROUP BY s.id, s.slug, s.name, s.is_current, s.is_active
ORDER BY s.is_current DESC, s.is_active DESC, s.name, s.id;

-- P7D.08_DECISION_COUNTS
SELECT 'P7D.08_DECISION_COUNTS' AS section, metric, row_count
FROM (VALUES
  ('club_contacts', (SELECT count(*)::bigint FROM public.club_contacts)),
  ('department_sections', (SELECT count(*)::bigint FROM public.department_sections)),
  ('department_training_times', (SELECT count(*)::bigint FROM public.department_training_times)),
  ('notification_audit', (SELECT count(*)::bigint FROM public.notification_audit)),
  ('club_closure_periods', (SELECT count(*)::bigint FROM public.club_closure_periods)),
  ('club_history_pages', (SELECT count(*)::bigint FROM public.club_history_pages)),
  ('club_history_images', (SELECT count(*)::bigint FROM public.club_history_images)),
  ('club_history_milestones', (SELECT count(*)::bigint FROM public.club_history_milestones)),
  ('pages', (SELECT count(*)::bigint FROM public.pages)),
  ('seasons', (SELECT count(*)::bigint FROM public.seasons)),
  ('media_assets', (SELECT count(*)::bigint FROM public.media_assets)),
  ('media_asset_usages', (SELECT count(*)::bigint FROM public.media_asset_usages)),
  ('admin_profiles_with_avatar', (SELECT count(*)::bigint FROM public.admin_profiles WHERE profile_image_media_asset_id IS NOT NULL)),
  ('admin_profile_avatar_usages', (SELECT count(*)::bigint FROM public.media_asset_usages WHERE entity_type='admin_profile' AND field_name='avatar')),
  ('downloads', (SELECT count(*)::bigint FROM public.downloads))
) counts(metric, row_count)
ORDER BY metric;

-- Expected resultsets: exactly 8.
