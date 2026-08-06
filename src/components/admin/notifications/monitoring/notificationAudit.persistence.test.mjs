import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const logger = await read("./notificationMonitoring.logger.js");
const schema = await read("../../../../../docs/sql/b15-18g-notification-audit-schema.sql");
const rls = await read("../../../../../docs/sql/b15-18g-notification-audit-rls.sql");
const postcheck = await read("../../../../../docs/sql/b15-18g-notification-audit-postcheck-readonly.sql");
const hardening = await read("../../../../../docs/sql/b15-18k-notification-audit-append-hardening.sql");

test("audit logger persists privacy-safe counters and retry defaults", () => {
  assert.match(logger, /rpc\("append_notification_audit"/);
  assert.doesNotMatch(logger, /from\("notification_audit"\)\.(?:insert|upsert)/);
  for (const key of ["p_recipient_count", "p_successful_count", "p_failed_count", "p_duplicate_count", "p_skipped_count"]) assert.match(logger, new RegExp(key));
  for (const forbidden of ["title:", "message:", "email:", "payment", "notes:"]) assert.doesNotMatch(logger, new RegExp(forbidden, "i"));
});

test("B15.18K permits only the service role to execute the sanitized append RPC", () => {
  assert.match(hardening, /REVOKE INSERT, UPDATE, DELETE, TRUNCATE[\s\S]+FROM anon, authenticated/);
  assert.match(hardening, /auth\.role\(\) IS DISTINCT FROM 'service_role'/);
  assert.match(hardening, /GRANT EXECUTE[\s\S]+TO service_role/);
  assert.match(hardening, /REVOKE ALL[\s\S]+FROM PUBLIC, anon, authenticated/);
  assert.doesNotMatch(hardening, /GRANT EXECUTE[\s\S]+TO authenticated/);
  for (const key of ["recipientAnalysis", "preferenceAnalysis", "dispatcherAnalysis"]) assert.match(hardening, new RegExp(key));
});

test("schema provides SQL history health recipient analysis and disabled retry", () => {
  for (const marker of ["notification_audit", "'today'", "'seven'", "'thirty'", "'ninety'", "recipientAnalysis", "retry_allowed boolean NOT NULL DEFAULT false", "SECURITY INVOKER"]) assert.match(schema, new RegExp(marker));
});

test("legacy B15.18G records superadmin reads, active-admin appends, and no update or delete", () => {
  assert.match(rls, /r\.key = 'superadmin'/);
  assert.match(rls, /FOR INSERT TO authenticated/);
  assert.doesNotMatch(rls, /app_metadata|service_role|FOR UPDATE|FOR DELETE/);
  assert.match(postcheck, /^SELECT/m);
  assert.doesNotMatch(postcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
});
