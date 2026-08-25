import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [service, actions, schema, rls, rollback] = await Promise.all([read("./media.service.js"), read("../../../app/admin/media/actions.js"), read("../../../../docs/sql/b15-19a-media-library-schema-proposal.sql"), read("../../../../docs/sql/b15-19a-media-library-rls-proposal.sql"), read("../../../../docs/sql/b15-19a-media-library-rollback.sql")]);

test("central upload is server-only, content validated and database failure cleans storage", () => {
  assert.match(service, /import "server-only"/);
  assert.match(service, /validateMediaDescriptor/);
  assert.match(service, /stage: "media_assets_insert"/);
  assert.match(service, /rollbackAttempted: true/);
  assert.match(actions, /assertAdminActionPermission/);
  assert.match(actions, /canManageMedia/);
  assert.match(actions, /try[\s\S]*catch/);
  assert.match(actions, /\[media-upload\]/);
});

test("schema separates public and private storage and keeps usages referential", () => {
  assert.match(schema, /media-library-public/);
  assert.match(schema, /media-library-private/);
  assert.match(schema, /REFERENCES public\.media_assets\(id\) ON DELETE RESTRICT/);
  assert.match(rls, /REVOKE ALL[\s\S]+FROM anon, authenticated/);
  assert.doesNotMatch(rls, /FOR (INSERT|UPDATE|DELETE) TO authenticated/);
  assert.match(rollback, /buckets are not empty/);
});
