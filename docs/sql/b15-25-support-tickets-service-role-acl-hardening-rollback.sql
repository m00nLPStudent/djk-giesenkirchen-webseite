-- B15.25 Support Tickets V1 - service_role ACL hardening rollback
-- MANUAL EXECUTION ONLY after explicit approval.
-- Restores only the explicit service_role ACL baseline observed before hardening.
-- Ticket data, schema, RLS, functions and global default privileges are untouched.

BEGIN;

DO $guard$
DECLARE
  actual_privileges text[];
  grantable_privilege_count bigint;
BEGIN
  IF to_regrole('service_role') IS NULL THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback requires service_role';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class relation_row
    JOIN pg_catalog.pg_namespace namespace_row
      ON namespace_row.oid = relation_row.relnamespace
    JOIN pg_catalog.pg_roles owner_row
      ON owner_row.oid = relation_row.relowner
    WHERE namespace_row.nspname = 'public'
      AND relation_row.relname = 'support_tickets'
      AND relation_row.relkind = 'r'
      AND owner_row.rolname = 'postgres'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class relation_row
    JOIN pg_catalog.pg_namespace namespace_row
      ON namespace_row.oid = relation_row.relnamespace
    JOIN pg_catalog.pg_roles owner_row
      ON owner_row.oid = relation_row.relowner
    WHERE namespace_row.nspname = 'public'
      AND relation_row.relname = 'support_ticket_messages'
      AND relation_row.relkind = 'r'
      AND owner_row.rolname = 'postgres'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class relation_row
    JOIN pg_catalog.pg_namespace namespace_row
      ON namespace_row.oid = relation_row.relnamespace
    JOIN pg_catalog.pg_roles owner_row
      ON owner_row.oid = relation_row.relowner
    WHERE namespace_row.nspname = 'public'
      AND relation_row.relname = 'support_ticket_events'
      AND relation_row.relkind = 'r'
      AND owner_row.rolname = 'postgres'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class relation_row
    JOIN pg_catalog.pg_namespace namespace_row
      ON namespace_row.oid = relation_row.relnamespace
    JOIN pg_catalog.pg_roles owner_row
      ON owner_row.oid = relation_row.relowner
    WHERE namespace_row.nspname = 'public'
      AND relation_row.relname = 'support_ticket_number_seq'
      AND relation_row.relkind = 'S'
      AND owner_row.rolname = 'postgres'
  ) THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback target relation type or owner differs from the verified contract';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_tickets'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY['INSERT', 'SELECT', 'UPDATE']::text[]
     OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_tickets baseline differs from the hardened contract';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_messages'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY['INSERT', 'SELECT']::text[]
     OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_ticket_messages baseline differs from the hardened contract';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_events'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY['INSERT', 'SELECT']::text[]
     OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_ticket_events baseline differs from the hardened contract';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_number_seq'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY['SELECT', 'USAGE']::text[]
     OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback sequence baseline differs from the hardened contract';
  END IF;
END;
$guard$;

REVOKE ALL PRIVILEGES ON TABLE public.support_tickets
  FROM service_role;
REVOKE ALL PRIVILEGES ON TABLE public.support_ticket_messages
  FROM service_role;
REVOKE ALL PRIVILEGES ON TABLE public.support_ticket_events
  FROM service_role;
REVOKE ALL PRIVILEGES ON SEQUENCE public.support_ticket_number_seq
  FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.support_ticket_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.support_ticket_events TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.support_ticket_number_seq
  TO service_role;

DO $verify$
DECLARE
  actual_privileges text[];
  grantable_privilege_count bigint;
BEGIN
  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_tickets'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY[
    'DELETE', 'INSERT', 'MAINTAIN', 'REFERENCES',
    'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'
  ]::text[] OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_tickets verification failed';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_messages'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY[
    'DELETE', 'INSERT', 'MAINTAIN', 'REFERENCES',
    'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'
  ]::text[] OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_ticket_messages verification failed';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_events'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY[
    'DELETE', 'INSERT', 'MAINTAIN', 'REFERENCES',
    'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'
  ]::text[] OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback support_ticket_events verification failed';
  END IF;

  SELECT
    coalesce(pg_catalog.array_agg(acl.privilege_type ORDER BY acl.privilege_type), ARRAY[]::text[]),
    count(*) FILTER (WHERE acl.is_grantable)
  INTO actual_privileges, grantable_privilege_count
  FROM pg_catalog.pg_class relation_row
  JOIN pg_catalog.pg_namespace namespace_row
    ON namespace_row.oid = relation_row.relnamespace
  CROSS JOIN LATERAL pg_catalog.aclexplode(relation_row.relacl) acl
  JOIN pg_catalog.pg_roles grantee_row ON grantee_row.oid = acl.grantee
  WHERE namespace_row.nspname = 'public'
    AND relation_row.relname = 'support_ticket_number_seq'
    AND grantee_row.rolname = 'service_role';

  IF actual_privileges <> ARRAY['SELECT', 'UPDATE', 'USAGE']::text[]
     OR grantable_privilege_count <> 0 THEN
    RAISE EXCEPTION 'B15.25 ACL hardening rollback sequence verification failed';
  END IF;
END;
$verify$;

COMMIT;
