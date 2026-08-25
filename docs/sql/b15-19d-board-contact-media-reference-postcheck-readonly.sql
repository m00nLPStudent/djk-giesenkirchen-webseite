-- B15.19D read-only postcheck. Does not change schema or data.

-- Expected: two rows, both nullable uuid columns.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('board_members', 'club_contacts')
  AND column_name = 'image_media_asset_id'
ORDER BY table_name;

-- Expected: two foreign keys referencing media_assets(id), ON DELETE SET NULL.
SELECT
  source.relname AS table_name,
  constraint_row.conname AS constraint_name,
  target.relname AS referenced_table,
  pg_get_constraintdef(constraint_row.oid) AS definition
FROM pg_constraint constraint_row
JOIN pg_class source ON source.oid = constraint_row.conrelid
JOIN pg_namespace source_schema ON source_schema.oid = source.relnamespace
JOIN pg_class target ON target.oid = constraint_row.confrelid
WHERE source_schema.nspname = 'public'
  AND source.relname IN ('board_members', 'club_contacts')
  AND constraint_row.contype = 'f'
  AND pg_get_constraintdef(constraint_row.oid) LIKE '%image_media_asset_id%'
ORDER BY source.relname;

-- Expected: two rows with valid partial indexes.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'board_members_image_media_asset_idx',
    'club_contacts_image_media_asset_idx'
  )
ORDER BY indexname;

-- Expected: one function containing all four entity types and both purpose mappings.
SELECT
  procedure_row.oid::regprocedure AS function_signature,
  pg_get_functiondef(procedure_row.oid) AS function_definition,
  strpos(pg_get_functiondef(procedure_row.oid), $$'coach'$$) > 0 AS supports_coach,
  strpos(pg_get_functiondef(procedure_row.oid), $$'player'$$) > 0 AS supports_player,
  strpos(pg_get_functiondef(procedure_row.oid), $$'board_member'$$) > 0 AS supports_board_member,
  strpos(pg_get_functiondef(procedure_row.oid), $$'club_contact'$$) > 0 AS supports_club_contact,
  strpos(pg_get_functiondef(procedure_row.oid), $$WHEN 'board_member' THEN 'board'$$) > 0 AS maps_board_purpose,
  strpos(pg_get_functiondef(procedure_row.oid), $$WHEN 'club_contact' THEN 'cms'$$) > 0 AS maps_contact_purpose
FROM pg_proc procedure_row
JOIN pg_namespace function_schema ON function_schema.oid = procedure_row.pronamespace
WHERE function_schema.nspname = 'public'
  AND procedure_row.proname = 'synchronize_media_assignment'
  AND pg_get_function_identity_arguments(procedure_row.oid) = 'p_entity_type text, p_entity_id uuid, p_media_asset_id uuid, p_field_name text';

-- Expected: service_role EXECUTE only; no PUBLIC, anon or authenticated EXECUTE.
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public'
  AND routine_name = 'synchronize_media_assignment'
ORDER BY grantee, privilege_type;

-- Expected: zero rows. Invalid Board/Contact references or asset contracts.
SELECT
  'board_member' AS entity_type,
  board_row.id AS entity_id,
  board_row.image_media_asset_id AS media_asset_id
FROM public.board_members board_row
LEFT JOIN public.media_assets asset ON asset.id = board_row.image_media_asset_id
WHERE board_row.image_media_asset_id IS NOT NULL
  AND (
    asset.id IS NULL OR asset.is_archived OR asset.media_kind <> 'image'
    OR asset.purpose <> 'board'
  )
UNION ALL
SELECT
  'club_contact',
  contact_row.id,
  contact_row.image_media_asset_id
FROM public.club_contacts contact_row
LEFT JOIN public.media_assets asset ON asset.id = contact_row.image_media_asset_id
WHERE contact_row.image_media_asset_id IS NOT NULL
  AND (
    asset.id IS NULL OR asset.is_archived OR asset.media_kind <> 'image'
    OR asset.purpose <> 'cms'
  );

-- Expected: zero rows. Duplicate usages for one entity image field.
SELECT entity_type, entity_id, field_name, count(*) AS usage_count
FROM public.media_asset_usages
WHERE entity_type IN ('board_member', 'club_contact')
  AND field_name = 'image'
GROUP BY entity_type, entity_id, field_name
HAVING count(*) > 1;

-- Expected: zero rows. Usages without matching Board/Contact reference.
SELECT usage_row.*
FROM public.media_asset_usages usage_row
LEFT JOIN public.board_members board_row
  ON usage_row.entity_type = 'board_member'
 AND board_row.id = usage_row.entity_id
 AND board_row.image_media_asset_id = usage_row.media_asset_id
LEFT JOIN public.club_contacts contact_row
  ON usage_row.entity_type = 'club_contact'
 AND contact_row.id = usage_row.entity_id
 AND contact_row.image_media_asset_id = usage_row.media_asset_id
WHERE usage_row.entity_type IN ('board_member', 'club_contact')
  AND usage_row.field_name = 'image'
  AND board_row.id IS NULL
  AND contact_row.id IS NULL;

-- Expected: zero rows. Media references without their matching usage.
SELECT 'board_member' AS entity_type, board_row.id AS entity_id, board_row.image_media_asset_id AS media_asset_id
FROM public.board_members board_row
LEFT JOIN public.media_asset_usages usage_row
  ON usage_row.entity_type = 'board_member'
 AND usage_row.entity_id = board_row.id
 AND usage_row.field_name = 'image'
 AND usage_row.media_asset_id = board_row.image_media_asset_id
WHERE board_row.image_media_asset_id IS NOT NULL AND usage_row.id IS NULL
UNION ALL
SELECT 'club_contact', contact_row.id, contact_row.image_media_asset_id
FROM public.club_contacts contact_row
LEFT JOIN public.media_asset_usages usage_row
  ON usage_row.entity_type = 'club_contact'
 AND usage_row.entity_id = contact_row.id
 AND usage_row.field_name = 'image'
 AND usage_row.media_asset_id = contact_row.image_media_asset_id
WHERE contact_row.image_media_asset_id IS NOT NULL AND usage_row.id IS NULL;
