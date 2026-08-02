import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("module uses the shared responsive list and detail system", () => {
  const source = read("./CategoryMasterDataModule.js");
  for (const component of ["AdminModulePage", "AdminModuleHeader", "AdminModuleSummary", "AdminModuleFilters", "AdminModuleList", "AdminModuleCards", "AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminActionBar", "AdminDangerZone", "AdminStatusChip"]) assert.match(source, new RegExp(component));
  assert.match(source, /xl:hidden|xl:block/);
});

test("server mutations recheck settings edit and allowlist tables", () => {
  const source = read("../../../../app/admin/settings/categories/actions.js");
  assert.match(source, /assertAdminActionPermission/);
  assert.match(source, /requiredPermission: "settings\.edit"/);
  assert.doesNotMatch(source, /service_role|app_metadata/i);
});

test("H2 SQL stays additive and permission-bound", () => {
  const schema = read("../../../../../docs/sql/b15-16h2-category-tables-schema.sql");
  const rls = read("../../../../../docs/sql/b15-16h2-category-tables-rls.sql");
  assert.equal((schema.match(/CREATE TABLE public\./g) || []).length, 3);
  assert.doesNotMatch(schema, /ALTER TABLE public\.(news|events|sponsor_categories)\b/i);
  assert.match(rls, /settings\.edit/);
  assert.doesNotMatch(rls, /app_metadata|(?:USING|WITH CHECK)\s*\(\s*true/i);
});
