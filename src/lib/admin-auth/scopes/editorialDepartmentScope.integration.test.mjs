import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("news lists, writes, direct ids and document mutations use the shared department scope", () => {
  const actions = read("../../../app/admin/news/actions.js");
  const list = read("../../../app/admin/news/page.js");
  const edit = read("../../../app/admin/news/edit/[id]/page.js");
  assert.match(actions, /authorizeNewsScope\(permission, newsId, db\)/);
  assert.match(actions, /scopeEditorialWritePayload\(scopeAuthorization\.scope/);
  assert.match(actions, /isAllowedEditorialCategory/);
  assert.match(actions, /authorizeNewsScope\(permission, current\.data\.news_id\)/);
  assert.match(list, /newsQuery\.eq\("department_id", scope\.departmentId\)/);
  assert.match(edit, /newsQuery = newsQuery\.eq\("department_id", scope\.departmentId\)/);
});

test("event lists, writes, teams, direct ids and document mutations use the shared department scope", () => {
  const actions = read("../../../app/admin/events/actions.js");
  const page = read("../../../app/admin/events/page.js");
  const service = read("../../../components/admin/events/services/events.service.js");
  assert.match(actions, /authorizeEventScope\(permission, eventId, db\)/);
  assert.match(actions, /validateEventTeamScope/);
  assert.match(actions, /scopeEditorialWritePayload\(scopeAuthorization\.scope/);
  assert.match(actions, /authorizeEventScope\(permission, current\.data\.event_id, db\)/);
  assert.match(page, /getAdminEvents\(adminClient, editorialScope\)/);
  assert.match(service, /query\.eq\("department_id", editorialScope\.departmentId\)/);
});

test("proposal is transactional and preserves the cashier contribution and public-read contracts", () => {
  const proposal = read("../../../../docs/sql/b15-table-tennis-board-cashier-permissions-proposal.sql");
  const postcheck = read("../../../../docs/sql/b15-table-tennis-board-cashier-permissions-postcheck-readonly.sql");
  assert.match(proposal, /^--[\s\S]*\bBEGIN;/);
  assert.match(proposal, /COMMIT;\s*$/);
  assert.match(proposal, /r\.key='kassierer' AND p\.key IN \('settings\.view','settings\.edit'\)/);
  assert.doesNotMatch(proposal, /DELETE FROM public\.admin_role_permissions[\s\S]{0,250}contributions\./);
  assert.match(proposal, /current_admin_permission_allows_department\('news\.edit',department_id\)/);
  assert.match(proposal, /current_admin_permission_allows_department\('events\.view',department_id\)/);
  assert.match(postcheck, /'PC\.10_OVERALL'/);
  const executablePostcheck = postcheck.replace(/--.*$/gm, "").replace(/'(?:''|[^'])*'/g, "''");
  assert.doesNotMatch(executablePostcheck, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|GRANT|REVOKE|TRUNCATE|MERGE)\b/i);
});
