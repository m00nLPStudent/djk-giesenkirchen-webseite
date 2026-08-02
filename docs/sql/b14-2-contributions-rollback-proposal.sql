-- B14.2 contributions rollback proposal
-- Proposal only. Do not execute automatically.

-- Rollback is only acceptable while both new tables are still empty.
-- If productive contribution or payment data exists, restore via backup plan instead
-- of schema deletion.

-- Guard 1: verify both tables are empty before any destructive rollback.
SELECT 'player_contributions' AS table_name, COUNT(*) AS row_count FROM public.player_contributions
UNION ALL
SELECT 'player_contribution_payments', COUNT(*) FROM public.player_contribution_payments
ORDER BY table_name;

-- Guard 2: inspect contribution permissions and mappings before removing them.
SELECT p.key AS permission_key, COUNT(rp.role_id) AS role_mapping_count
FROM public.admin_permissions AS p
LEFT JOIN public.admin_role_permissions AS rp ON rp.permission_id = p.id
WHERE p.key ILIKE 'contributions.%'
GROUP BY p.key
ORDER BY p.key;

-- Backup requirement:
-- take a schema backup before any rollback execution.

-- If and only if both tables are empty, the following manual rollback sequence
-- may be executed in a controlled maintenance window:
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_player_contribution_payments_sync_parent ON public.player_contribution_payments;
-- DROP TRIGGER IF EXISTS trg_player_contribution_payments_set_updated_at ON public.player_contribution_payments;
-- DROP TRIGGER IF EXISTS trg_player_contributions_set_updated_at ON public.player_contributions;
-- DROP FUNCTION IF EXISTS public.sync_player_contribution_payment_cache();
-- DROP TABLE IF EXISTS public.player_contribution_payments;
-- DROP TABLE IF EXISTS public.player_contributions;
-- DELETE FROM public.admin_role_permissions
-- WHERE permission_id IN (
--   SELECT id FROM public.admin_permissions WHERE key ILIKE 'contributions.%'
-- );
-- DELETE FROM public.admin_permissions
-- WHERE key IN (
--   'contributions.view',
--   'contributions.create',
--   'contributions.edit',
--   'contributions.record_payment',
--   'contributions.cancel_payment',
--   'contributions.defer',
--   'contributions.exempt',
--   'contributions.cancel',
--   'contributions.export'
-- );
-- COMMIT;

-- If any rows exist, do not drop anything. Use backup-based recovery or a forward
-- fixing migration instead.
