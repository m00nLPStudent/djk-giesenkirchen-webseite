import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deleteSelectedNotificationsForUser } from "./notifications.repository.js";

const deliverySql = await readFile(new URL("../../../../docs/sql/b15-21d4-notification-email-delivery-proposal.sql", import.meta.url), "utf8");
const auditSql = await readFile(new URL("../../../../docs/sql/b15-18g-notification-audit-schema.sql", import.meta.url), "utf8");

test("bulk repository deletion combines the ID list with the authenticated owner", async () => {
  const calls = [];
  const query = {
    delete(options) { calls.push(["delete", options]); return this; },
    in(column, values) { calls.push(["in", column, values]); return this; },
    eq(column, value) { calls.push(["eq", column, value]); return Promise.resolve({ count: 2, error: null }); },
  };
  const db = { from(table) { calls.push(["from", table]); return query; } };
  const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];

  const result = await deleteSelectedNotificationsForUser({ db, userId: "current-user", notificationIds: ids });

  assert.deepEqual(calls, [
    ["from", "notifications"],
    ["delete", { count: "exact" }],
    ["in", "id", ids],
    ["eq", "recipient_user_id", "current-user"],
  ]);
  assert.equal(result.count, 2);
});

test("notification deletion cascades only into the operational delivery ledger", () => {
  assert.match(deliverySql, /notification_id\s+uuid\s+NOT NULL\s+REFERENCES public\.notifications\(id\)\s+ON DELETE CASCADE/i);
  assert.doesNotMatch(auditSql, /notification_id\s+[^,;]*REFERENCES public\.notifications/i);
  assert.match(auditSql, /notification_audit/i);
});
