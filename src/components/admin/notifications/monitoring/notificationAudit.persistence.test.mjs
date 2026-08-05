import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const logger = await read("./notificationMonitoring.logger.js");
const schema = await read("../../../../../docs/sql/b15-18g-notification-audit-schema.sql");
const rls = await read("../../../../../docs/sql/b15-18g-notification-audit-rls.sql");
const postcheck = await read("../../../../../docs/sql/b15-18g-notification-audit-postcheck-readonly.sql");

test("audit logger persists privacy-safe counters and retry defaults", () => {
  assert.match(logger, /from\("notification_audit"\)\.insert/);
  for (const key of ["recipient_count", "successful_count", "failed_count", "duplicate_count", "skipped_count", "retry_allowed"]) assert.match(logger, new RegExp(key));
  for (const forbidden of ["title:", "message:", "email:", "payment", "notes:"]) assert.doesNotMatch(logger, new RegExp(forbidden, "i"));
});

test("schema provides SQL history health recipient analysis and disabled retry", () => {
  for (const marker of ["notification_audit", "'today'", "'seven'", "'thirty'", "'ninety'", "recipientAnalysis", "retry_allowed boolean NOT NULL DEFAULT false", "SECURITY INVOKER"]) assert.match(schema, new RegExp(marker));
});

test("RLS allows superadmin reads, active-admin appends, and no update or delete", () => {
  assert.match(rls, /r\.key = 'superadmin'/);
  assert.match(rls, /FOR INSERT TO authenticated/);
  assert.doesNotMatch(rls, /app_metadata|service_role|FOR UPDATE|FOR DELETE/);
  assert.match(postcheck, /^SELECT/m);
  assert.doesNotMatch(postcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
});
