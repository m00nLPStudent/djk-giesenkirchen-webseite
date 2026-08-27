import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = (name) => readFile(new URL(`../../../../docs/sql/${name}`, import.meta.url), "utf8");
const [proposal, rollback, postcheck] = await Promise.all([
  sql("b15-23b1-person-security-hardening-proposal.sql"),
  sql("b15-23b1-person-security-hardening-rollback.sql"),
  sql("b15-23b1-person-security-hardening-postcheck-readonly.sql"),
]);

test("proposal hardens only the three legacy person tables transactionally", () => {
  assert.match(proposal, /^--[\s\S]*\bBEGIN;[\s\S]*\bCOMMIT;\s*$/);
  for (const table of ["coaches", "board_members", "club_contacts"]) {
    assert.match(proposal, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.doesNotMatch(proposal, /persons|auth\.users|admin_profile_id\s*=|INSERT INTO public\.admin_role_permissions/i);
});

test("anon is select-only and special browser privileges are revoked", () => {
  assert.match(proposal, /GRANT SELECT ON TABLE public\.coaches, public\.board_members, public\.club_contacts TO anon/);
  assert.doesNotMatch(proposal, /GRANT (?:INSERT|UPDATE|DELETE|ALL)[^;]* TO anon/i);
  assert.match(proposal, /REVOKE ALL PRIVILEGES ON TABLE[\s\S]*FROM PUBLIC, anon, authenticated/);
  for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER"]) assert.match(postcheck, new RegExp(`'${privilege}'`));
});

test("authenticated rights match existing server actions and use current permissions", () => {
  assert.match(proposal, /GRANT INSERT, UPDATE, DELETE ON TABLE public\.coaches TO authenticated/);
  assert.match(proposal, /GRANT INSERT, UPDATE ON TABLE public\.board_members TO authenticated/);
  assert.match(proposal, /GRANT INSERT, UPDATE, DELETE ON TABLE public\.club_contacts TO authenticated/);
  for (const permission of ["coaches.view", "coaches.create", "coaches.edit", "coaches.delete", "settings.view", "settings.edit"]) {
    assert.match(proposal, new RegExp(permission.replace(".", "\\.")));
  }
  assert.doesNotMatch(proposal, /p\.key IN \('coaches\.create','coaches\.delete'\)/);
  assert.doesNotMatch(proposal, /app_metadata/);
});

test("public reads are active-scoped and RPC execution stays service-role only", () => {
  assert.match(proposal, /coaches_public_read_active[\s\S]*is_active = true/);
  assert.match(proposal, /board_members_public_read_active[\s\S]*is_active = true/);
  assert.match(proposal, /club_contacts_public_read_active[\s\S]*is_public = true AND is_active = true/);
  for (const signature of ["remove_entity(text,uuid)", "synchronize_media_assignment(text,uuid,uuid,text)"]) {
    assert.ok(proposal.includes(`REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon, authenticated`));
    assert.ok(proposal.includes(`GRANT EXECUTE ON FUNCTION public.${signature} TO service_role`));
  }
});

test("rollback restores the confirmed legacy baseline and postcheck remains read-only", () => {
  assert.match(rollback, /ALTER TABLE public\.club_contacts DISABLE ROW LEVEL SECURITY/);
  for (const policy of ["Allow public insert coaches", "board_members_insert_all", "club_contacts_insert_admin"]) assert.match(rollback, new RegExp(policy));
  assert.doesNotMatch(postcheck, /^\s*(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|DO|CALL)\b/im);
});
