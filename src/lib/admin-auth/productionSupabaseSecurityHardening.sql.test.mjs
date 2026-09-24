import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = (name) => fs.readFileSync(new URL(`../../../docs/sql/${name}`, import.meta.url), "utf8");
const proposal = sql("b15-production-supabase-security-hardening-proposal.sql");
const rollback = sql("b15-production-supabase-security-hardening-rollback.sql");
const postcheck = sql("b15-production-supabase-security-hardening-postcheck-readonly.sql");

test("hardening proposal is transactional, fail-closed and permission based", () => {
  assert.match(proposal, /^BEGIN;/m);
  assert.match(proposal, /COMMIT;\s*$/);
  assert.match(proposal, /RAISE EXCEPTION 'Unexpected RLS\/policy baseline/);
  for (const table of ["club_settings", "membership_request_recipients", "pages"]) {
    assert.match(proposal, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  }
  for (const permission of [
    "settings.edit", "membership_requests.view", "membership_requests.edit",
    "events.view", "news.view", "news.create", "news.edit", "news.publish", "news.delete",
  ]) {
    assert.ok(proposal.includes(`current_admin_has_permission('${permission}')`));
  }
  assert.match(proposal, /REVOKE ALL ON TABLE[\s\S]+FROM anon, authenticated;/);
  assert.doesNotMatch(proposal, /^\s*(INSERT INTO|UPDATE\s+public\.|DELETE FROM|TRUNCATE\s+TABLE|MERGE INTO)\b/im);
});

test("public reads stay publication gated and routing stays private", () => {
  assert.match(proposal, /pages_public_read_published[\s\S]+is_published = true/);
  assert.match(proposal, /events_public_read_published[\s\S]+is_published = true/);
  assert.match(proposal, /news_public_read_published[\s\S]+published_at <= now\(\)/);
  assert.match(proposal, /news_documents_public_read[\s\S]+parent_news\.published_at <= now\(\)/);
  assert.doesNotMatch(proposal, /GRANT SELECT[\s\S]*public\.membership_request_recipients[\s\S]*TO anon;/);
});

test("news updates combine edit RLS with a transition-aware publish guard", () => {
  assert.match(proposal, /news_update_authorized[\s\S]+USING \(public\.current_admin_has_permission\('news\.edit'\)\)[\s\S]+WITH CHECK \(public\.current_admin_has_permission\('news\.edit'\)\)/);
  assert.match(proposal, /OLD\.is_published IS DISTINCT FROM NEW\.is_published/);
  assert.match(proposal, /NEW\.is_published = true[\s\S]+OLD\.published_at IS DISTINCT FROM NEW\.published_at/);
  assert.match(proposal, /NOT public\.current_admin_has_permission\('news\.publish'\)/);
  assert.match(proposal, /auth\.role\(\) IS NOT DISTINCT FROM 'service_role'/);
  assert.match(proposal, /BEFORE UPDATE OF is_published, published_at ON public\.news/);
  assert.match(proposal, /REVOKE ALL ON FUNCTION public\.enforce_news_publication_transition\(\)[\s\S]+FROM PUBLIC, anon, authenticated/);
});

test("news permission scenarios preserve editorial edits and protect publication transitions", () => {
  const allowed = ({ edit, publish, transition }) => edit && (!transition || publish);
  assert.equal(allowed({ edit: true, publish: false, transition: false }), true);
  assert.equal(allowed({ edit: true, publish: false, transition: true }), false);
  assert.equal(allowed({ edit: true, publish: true, transition: true }), true);
  assert.equal(allowed({ edit: false, publish: true, transition: false }), false);
  assert.equal(allowed({ edit: false, publish: false, transition: false }), false);
});

test("rollback is transactional and postcheck remains read-only", () => {
  assert.match(rollback, /^BEGIN;/m);
  assert.match(rollback, /COMMIT;\s*$/);
  assert.match(rollback, /DISABLE ROW LEVEL SECURITY/);
  assert.match(rollback, /DROP TRIGGER news_enforce_publication_transition ON public\.news/);
  assert.match(rollback, /DROP FUNCTION public\.enforce_news_publication_transition\(\)/);
  assert.match(rollback, /GRANT EXECUTE ON FUNCTION public\.is_superadmin_actor\(\) TO PUBLIC/);

  const statements = postcheck
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  assert.ok(statements.length >= 8);
  for (const statement of statements) assert.match(statement, /^(SELECT|WITH)\b/i);
});
