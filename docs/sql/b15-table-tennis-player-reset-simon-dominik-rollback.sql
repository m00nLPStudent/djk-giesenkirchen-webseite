-- B15 - Tischtennis Player Reset Simon/Dominik
-- Phase 3: exact rollback for the confirmed live preflight snapshot.
-- MANUAL EXECUTION ONLY, and only after the matching proposal.

BEGIN;

DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM public.players WHERE id = ANY (ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ])) THEN
    RAISE EXCEPTION 'At least one target player already exists; rollback aborted';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = '76656115-1493-477e-bd91-87592709fea3'::uuid AND slug = 'tischtennis')
     OR NOT EXISTS (SELECT 1 FROM public.media_assets WHERE id = '8768546f-2d55-4f27-902f-c577a828b0ae'::uuid)
     OR (SELECT count(*) FROM public.team_seasons WHERE id = ANY (ARRAY[
       '4b0fa350-9924-4851-8fa5-cb9413813b46'::uuid,
       '2e36a7ec-9134-45be-a0c7-6628211d04e4'::uuid,
       'af4919c6-e134-4dea-a9f3-5cb1d371576e'::uuid
     ])) <> 3 THEN
    RAISE EXCEPTION 'Rollback dependency baseline is incomplete; aborting';
  END IF;
END
$guard$;

INSERT INTO public.players (
  id, team_id, first_name, last_name, shirt_number, position_de, position_en,
  image_url, is_active, sort_order, created_at, photo_url, description_de,
  description_en, birthdate, year_group, strong_foot, nationality, is_captain,
  jersey_number, position, name_de, name_en, gender, joined_at,
  image_media_asset_id, strong_hand, department_id
) VALUES
  ('b8f3a063-8601-43c8-a1ba-878e977be1e5', NULL, 'Simon', 'Georgens', NULL, NULL, NULL, 'https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media-library-public/images/system/8768546f-2d55-4f27-902f-c577a828b0ae.png', true, 0, '2026-09-20T17:02:38.574483+00:00', NULL, NULL, NULL, '2026-09-20', '2026', NULL, 'DE', false, NULL, NULL, NULL, NULL, 'male', NULL, '8768546f-2d55-4f27-902f-c577a828b0ae', 'Rechts', '76656115-1493-477e-bd91-87592709fea3'),
  ('4e4f355f-0d73-490f-81ab-62a6d4770966', NULL, 'Dominik', 'Neeten', NULL, NULL, NULL, 'https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media-library-public/images/system/8768546f-2d55-4f27-902f-c577a828b0ae.png', true, 0, '2026-09-20T17:09:54.307773+00:00', NULL, NULL, NULL, '2026-09-20', '2026', NULL, 'DE', false, NULL, NULL, NULL, NULL, 'male', NULL, '8768546f-2d55-4f27-902f-c577a828b0ae', 'Rechts', '76656115-1493-477e-bd91-87592709fea3'),
  ('68db3030-c0a1-48a3-adc8-7aa6d5f4f94b', NULL, 'Simon', 'Georgens', NULL, NULL, NULL, 'https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media-library-public/images/system/8768546f-2d55-4f27-902f-c577a828b0ae.png', true, 0, '2026-09-20T17:16:45.338922+00:00', NULL, NULL, NULL, '2026-09-20', '2026', NULL, 'DE', false, NULL, NULL, NULL, NULL, 'male', NULL, '8768546f-2d55-4f27-902f-c577a828b0ae', 'Rechts', '76656115-1493-477e-bd91-87592709fea3'),
  ('f140ecbe-97ef-456f-b0df-b13558182877', NULL, 'Dominik', 'Neeten', NULL, NULL, NULL, 'https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media-library-public/images/system/8768546f-2d55-4f27-902f-c577a828b0ae.png', true, 0, '2026-09-20T17:17:32.538662+00:00', NULL, NULL, NULL, '2026-09-20', '2026', NULL, 'DE', false, NULL, NULL, NULL, NULL, 'male', NULL, '8768546f-2d55-4f27-902f-c577a828b0ae', 'Rechts', '76656115-1493-477e-bd91-87592709fea3');

INSERT INTO public.player_team_seasons (
  id, player_id, team_season_id, shirt_number, position_de, position_en,
  is_captain, is_active, sort_order, created_at
) VALUES
  ('3f897745-574b-4114-9efa-5b447b63736d', 'b8f3a063-8601-43c8-a1ba-878e977be1e5', '4b0fa350-9924-4851-8fa5-cb9413813b46', NULL, NULL, NULL, false, true, 1, '2026-09-20T17:02:38.64146+00:00'),
  ('304c2010-d19a-4355-8541-399377ff9784', '4e4f355f-0d73-490f-81ab-62a6d4770966', '2e36a7ec-9134-45be-a0c7-6628211d04e4', NULL, NULL, NULL, false, true, 3, '2026-09-20T17:09:54.397149+00:00'),
  ('7687a793-e004-45e4-bc03-c5237e42b208', 'f140ecbe-97ef-456f-b0df-b13558182877', 'af4919c6-e134-4dea-a9f3-5cb1d371576e', NULL, NULL, NULL, false, true, 2, '2026-09-20T17:17:32.634623+00:00'),
  ('b5260cc2-fa65-4f7c-ac9c-6d0702ab5272', '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b', 'af4919c6-e134-4dea-a9f3-5cb1d371576e', NULL, NULL, NULL, false, true, 0, '2026-09-20T17:16:45.425821+00:00');

INSERT INTO public.media_asset_usages (
  id, media_asset_id, entity_type, entity_id, field_name, created_at
) VALUES
  ('6cc4321a-1043-4296-ab7c-c0c077d018b6', '8768546f-2d55-4f27-902f-c577a828b0ae', 'player', '4e4f355f-0d73-490f-81ab-62a6d4770966', 'image', '2026-09-20T17:09:54.474573+00:00'),
  ('82c7af25-a622-4f5f-807a-6eec3a217dd9', '8768546f-2d55-4f27-902f-c577a828b0ae', 'player', '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b', 'image', '2026-09-20T17:16:45.523154+00:00'),
  ('a5381cf4-6395-49fa-817c-64eec3be2dd8', '8768546f-2d55-4f27-902f-c577a828b0ae', 'player', 'b8f3a063-8601-43c8-a1ba-878e977be1e5', 'image', '2026-09-20T17:02:38.708465+00:00'),
  ('1eb25de4-d208-42a3-84c1-571ab0cb8648', '8768546f-2d55-4f27-902f-c577a828b0ae', 'player', 'f140ecbe-97ef-456f-b0df-b13558182877', 'image', '2026-09-20T17:17:32.752413+00:00');

DO $post_guard$
DECLARE
  v_target_ids constant uuid[] := ARRAY[
    'b8f3a063-8601-43c8-a1ba-878e977be1e5'::uuid,
    '68db3030-c0a1-48a3-adc8-7aa6d5f4f94b'::uuid,
    '4e4f355f-0d73-490f-81ab-62a6d4770966'::uuid,
    'f140ecbe-97ef-456f-b0df-b13558182877'::uuid
  ];
BEGIN
  IF (SELECT count(*) FROM public.players WHERE id = ANY (v_target_ids)) <> 4
     OR (SELECT count(*) FROM public.player_team_seasons WHERE player_id = ANY (v_target_ids)) <> 4
     OR (SELECT count(*) FROM public.media_asset_usages WHERE entity_type = 'player' AND entity_id = ANY (v_target_ids)) <> 4
     OR (SELECT count(*) FROM public.player_contributions WHERE player_id = ANY (v_target_ids)) <> 0
     OR (SELECT count(*) FROM public.notifications WHERE entity_type = 'player' AND entity_id = ANY (v_target_ids)) <> 0 THEN
    RAISE EXCEPTION 'Rollback postcondition failed; transaction will roll back';
  END IF;
END
$post_guard$;

COMMIT;
