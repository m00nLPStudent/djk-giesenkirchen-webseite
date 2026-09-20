-- B15 - Tischtennis Player Reset Simon/Dominik
-- Phase 1: READ-ONLY live preflight
-- This file must not mutate schema or data.

-- P1.01 Exact target masters. Expected: exactly four rows, two per name.
SELECT
  p.id,
  p.first_name,
  p.last_name,
  d.slug AS department_slug,
  p.is_active
FROM public.players AS p
LEFT JOIN public.departments AS d ON d.id = p.department_id
WHERE (p.first_name = 'Simon' AND p.last_name = 'Georgens')
   OR (p.first_name = 'Dominik' AND p.last_name = 'Neeten')
ORDER BY p.last_name, p.first_name, p.id;

-- P1.02 Target cardinality and scope contract.
SELECT
  count(*) FILTER (
    WHERE first_name = 'Simon' AND last_name = 'Georgens'
  ) AS simon_georgens_count,
  count(*) FILTER (
    WHERE first_name = 'Dominik' AND last_name = 'Neeten'
  ) AS dominik_neeten_count,
  count(*) AS total_target_count,
  bool_and(d.slug = 'tischtennis') AS all_targets_table_tennis
FROM public.players AS p
LEFT JOIN public.departments AS d ON d.id = p.department_id
WHERE (p.first_name = 'Simon' AND p.last_name = 'Georgens')
   OR (p.first_name = 'Dominik' AND p.last_name = 'Neeten');

-- P1.03 Every live FK that references public.players(id).
SELECT
  con.conname AS constraint_name,
  format('%I.%I', child_ns.nspname, child.relname) AS referencing_relation,
  pg_catalog.pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS child ON child.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS child_ns ON child_ns.oid = child.relnamespace
WHERE con.contype = 'f'
  AND con.confrelid = 'public.players'::regclass
ORDER BY referencing_relation, constraint_name;

-- P1.04 Seasonal assignment snapshot for the four fixed target UUIDs.
SELECT pts.*
FROM public.player_team_seasons AS pts
WHERE pts.player_id = ANY (ARRAY[
  'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
  '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
  '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
  'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
])
ORDER BY pts.player_id, pts.id;

-- P1.05 Contribution references. Expected: no rows.
SELECT pc.*
FROM public.player_contributions AS pc
WHERE pc.player_id = ANY (ARRAY[
  'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
  '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
  '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
  'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
])
ORDER BY pc.player_id, pc.id;

-- P1.06 Polymorphic media usages. The media asset itself is not a delete target.
SELECT mau.*
FROM public.media_asset_usages AS mau
WHERE mau.entity_type = 'player'
  AND mau.entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])
ORDER BY mau.entity_id, mau.id;

-- P1.07 Notification entity references. Expected: no rows.
SELECT n.id, n.type, n.entity_type, n.entity_id, n.created_at
FROM public.notifications AS n
WHERE n.entity_type = 'player'
  AND n.entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])
ORDER BY n.entity_id, n.id;

-- P1.08 Baseline counts used by the guarded proposal/postcheck.
SELECT
  (SELECT count(*) FROM public.players) AS total_players,
  (SELECT count(*) FROM public.player_team_seasons WHERE player_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS target_assignments,
  (SELECT count(*) FROM public.player_contributions WHERE player_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS target_contributions,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'player' AND entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS target_media_usages;
