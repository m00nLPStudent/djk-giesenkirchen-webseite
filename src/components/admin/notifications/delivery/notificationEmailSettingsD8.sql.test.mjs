import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = (name) => readFile(new URL(`../../../../../docs/sql/${name}`, import.meta.url), "utf8");
const [preflight, proposal, rollback, postcheck, deliveryCore] = await Promise.all([
  sql("b15-21d8-notification-email-settings-preflight-readonly.sql"),
  sql("b15-21d8-notification-email-settings-proposal.sql"),
  sql("b15-21d8-notification-email-settings-rollback.sql"),
  sql("b15-21d8-notification-email-settings-postcheck-readonly.sql"),
  readFile(new URL("./notificationEmailDelivery.core.mjs", import.meta.url), "utf8"),
]);

const executableSql = (value) => value
  .replace(/--.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/'(?:''|[^'])*'/g, "''");

test("D8 preflight and postcheck are strictly read-only", () => {
  const mutating = /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT|REVOKE|COMMENT|DO|CALL|COPY)\b/i;
  assert.doesNotMatch(executableSql(preflight), mutating);
  assert.doesNotMatch(executableSql(postcheck), mutating);
  assert.match(preflight, /WITH callable AS MATERIALIZED[\s\S]*prokind IN \('f', 'p'\)[\s\S]*pg_get_functiondef/i);
});

test("proposal creates default-deny service-role-only settings and a disabled master", () => {
  for (const table of ["notification_email_settings", "notification_email_global_settings"]) {
    assert.match(proposal, new RegExp(`CREATE TABLE public\\.${table}`));
    assert.match(proposal, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
    assert.match(proposal, new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM PUBLIC, anon, authenticated`));
    assert.match(proposal, new RegExp(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\\.${table} TO service_role`));
  }
  assert.match(proposal, /email_enabled boolean NOT NULL DEFAULT false/);
  assert.match(proposal, /email_delivery_enabled boolean NOT NULL DEFAULT false/);
  assert.match(proposal, /VALUES \('global', false\)/);
  assert.match(proposal, /to_regrole\('anon'\)[\s\S]*to_regrole\('authenticated'\)[\s\S]*to_regrole\('service_role'\)/);
  assert.match(proposal, /admin_profiles[\s\S]*column_name = 'id' AND udt_name = 'uuid'/);
  assert.doesNotMatch(proposal, /CREATE POLICY|TO authenticated;|TO anon;/i);
});

test("initial recommendation contains exactly 16 enabled and 11 disabled productive types", () => {
  const rows = [...proposal.matchAll(/\('([a-z][a-z0-9_]*)', (true|false)\)/g)]
    .filter(([, key]) => key !== "global")
    .map(([, type, enabled]) => ({ type, enabled: enabled === "true" }));
  assert.equal(rows.length, 27);
  assert.equal(new Set(rows.map(({ type }) => type)).size, 27);
  assert.equal(rows.filter(({ enabled }) => enabled).length, 16);
  assert.equal(rows.filter(({ enabled }) => !enabled).length, 11);
});

test("postcheck proves RLS grants seed counts and missing-type deny semantics", () => {
  for (const marker of [
    "relrowsecurity", "relforcerowsecurity", "pg_policies", "role_table_grants",
    "role_column_grants", "anon", "authenticated", "service_role",
    "master_starts_disabled", "missing_type_is_default_denied",
    "exact_initial_type_count", "exact_initial_enabled_count", "exact_initial_disabled_count",
    "exact_type_key_and_value_matrix", "exact_preflight_notification_count",
    "exact_preflight_delivery_count", "duplicate_notification_idempotency_groups",
    "missing_recipient_count", "missing_idempotency_key_count",
  ]) assert.ok(postcheck.includes(marker));
});

test("rollback is marker-guarded and D9 renderer registry matches the 16 recommended types", () => {
  assert.match(rollback, /obj_description[\s\S]*B15\.21D8[\s\S]*RAISE EXCEPTION/i);
  assert.match(rollback, /DROP TABLE IF EXISTS public\.notification_email_settings/);
  assert.match(rollback, /DROP TABLE IF EXISTS public\.notification_email_global_settings/);
  assert.deepEqual(
    [...deliveryCore.matchAll(/^  ([a-z][a-z0-9_]*): /gm)].map((match) => match[1]),
    ["membership_created", "membership_assigned", "membership_forwarded", "membership_completed", "trainer_assigned", "trainer_removed", "trainer_changed", "player_assigned", "team_changed", "membership_processing", "membership_payment_overdue", "membership_payment_partial_open", "member_activated", "member_deactivated", "member_archived", "event_updated"],
  );
});
