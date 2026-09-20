-- B15 - Tischtennis Player Reset Simon/Dominik
-- Phase 4: READ-ONLY postcheck after manual proposal execution.

-- P4.01 Exact names and UUIDs must all be absent.
SELECT
  count(*) FILTER (WHERE first_name = 'Simon' AND last_name = 'Georgens') AS simon_georgens_remaining,
  count(*) FILTER (WHERE first_name = 'Dominik' AND last_name = 'Neeten') AS dominik_neeten_remaining,
  count(*) FILTER (WHERE id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS target_uuid_rows_remaining,
  count(*) AS total_players,
  count(*) = 190 AS remaining_player_count_ok
FROM public.players;

-- P4.02 No target dependencies may remain.
SELECT
  (SELECT count(*) FROM public.player_team_seasons WHERE player_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS assignment_rows_remaining,
  (SELECT count(*) FROM public.player_contributions WHERE player_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS contribution_rows_remaining,
  (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'player' AND entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS media_usage_rows_remaining,
  (SELECT count(*) FROM public.notifications WHERE entity_type = 'player' AND entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) AS notification_rows_remaining;

-- P4.03 No orphaned rows in actual FK relations.
SELECT pts.id, pts.player_id
FROM public.player_team_seasons AS pts
LEFT JOIN public.players AS p ON p.id = pts.player_id
WHERE p.id IS NULL
ORDER BY pts.id;

SELECT pc.id, pc.player_id
FROM public.player_contributions AS pc
LEFT JOIN public.players AS p ON p.id = pc.player_id
WHERE p.id IS NULL
ORDER BY pc.id;

-- P4.04 Global closure result. Expected: all booleans true.
SELECT
  (SELECT count(*) FROM public.players WHERE first_name = 'Simon' AND last_name = 'Georgens') = 0 AS simon_removed,
  (SELECT count(*) FROM public.players WHERE first_name = 'Dominik' AND last_name = 'Neeten') = 0 AS dominik_removed,
  (SELECT count(*) FROM public.players) = 190 AS no_additional_player_deleted,
  NOT EXISTS (
    SELECT 1 FROM public.player_team_seasons WHERE player_id = ANY (ARRAY[
      'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
      '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
      '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
      'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
    ])
  ) AS target_assignments_removed,
  NOT EXISTS (
    SELECT 1 FROM public.media_asset_usages
    WHERE entity_type = 'player'
      AND entity_id = ANY (ARRAY[
        'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
        '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
        '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
        'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
      ])
  ) AS target_media_usages_removed;
