-- B15 - Tischtennis Player Reset Simon/Dominik
-- Phase 2: guarded delete proposal. MANUAL EXECUTION ONLY.

BEGIN;

DO $guard$
DECLARE
  v_target_ids constant uuid[] := ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ];
  v_fk_relations text[];
BEGIN
  IF (SELECT count(*) FROM public.players WHERE id = ANY (v_target_ids)) <> 4 THEN
    RAISE EXCEPTION 'Target player UUID baseline changed; aborting';
  END IF;

  IF (SELECT count(*) FROM public.players
      WHERE id = ANY (v_target_ids)
        AND ((first_name = 'Simon' AND last_name = 'Georgens')
          OR (first_name = 'Dominik' AND last_name = 'Neeten'))) <> 4 THEN
    RAISE EXCEPTION 'Target player identity baseline changed; aborting';
  END IF;

  IF (SELECT count(*) FROM public.players
      WHERE first_name = 'Simon' AND last_name = 'Georgens') <> 2
     OR (SELECT count(*) FROM public.players
         WHERE first_name = 'Dominik' AND last_name = 'Neeten') <> 2 THEN
    RAISE EXCEPTION 'Exact-name cardinality changed; aborting';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.players AS p
    LEFT JOIN public.departments AS d ON d.id = p.department_id
    WHERE p.id = ANY (v_target_ids)
      AND (d.slug IS DISTINCT FROM 'tischtennis' OR p.is_active IS DISTINCT FROM true)
  ) THEN
    RAISE EXCEPTION 'Target player scope/status baseline changed; aborting';
  END IF;

  SELECT array_agg(format('%I.%I', ns.nspname, c.relname) ORDER BY ns.nspname, c.relname)
    INTO v_fk_relations
  FROM pg_catalog.pg_constraint AS con
  JOIN pg_catalog.pg_class AS c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace AS ns ON ns.oid = c.relnamespace
  WHERE con.contype = 'f'
    AND con.confrelid = 'public.players'::regclass;

  IF v_fk_relations IS DISTINCT FROM ARRAY[
    'public.player_contributions',
    'public.player_team_seasons'
  ]::text[] THEN
    RAISE EXCEPTION 'Unexpected players FK contract: %', v_fk_relations;
  END IF;

  IF (SELECT count(*) FROM public.player_team_seasons WHERE player_id = ANY (v_target_ids)) <> 4
     OR (SELECT count(*) FROM public.player_contributions WHERE player_id = ANY (v_target_ids)) <> 0
     OR (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'player' AND entity_id = ANY (v_target_ids)) <> 4
     OR (SELECT count(*) FROM public.notifications WHERE entity_type = 'player' AND entity_id = ANY (v_target_ids)) <> 0 THEN
    RAISE EXCEPTION 'Target dependency baseline changed; rerun preflight';
  END IF;
END
$guard$;

DELETE FROM public.notifications
WHERE entity_type = 'player'
  AND entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ]);

DELETE FROM public.media_asset_usages
WHERE entity_type = 'player'
  AND entity_id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ]);

DELETE FROM public.player_contributions
WHERE player_id = ANY (ARRAY[
  'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
  '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
  '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
  'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
]);

DELETE FROM public.player_team_seasons
WHERE player_id = ANY (ARRAY[
  'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
  '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
  '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
  'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
]);

DELETE FROM public.players
WHERE id = ANY (ARRAY[
  'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
  '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
  '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
  'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
]);

DO $post_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.players WHERE id = ANY (ARRAY[
      'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
      '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
      '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
      'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
    ])
  ) OR (SELECT count(*) FROM public.players) <> 190 THEN
    RAISE EXCEPTION 'Delete postcondition failed; transaction will roll back';
  END IF;
END
$post_guard$;

COMMIT;
