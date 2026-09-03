import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("department list and create routes fail closed for a foreign department manager", () => {
  const files = [
    "src/app/admin/players/page.js",
    "src/app/admin/coaches/page.js",
    "src/app/admin/teams/page.js",
    "src/app/admin/department/page.js",
    "src/app/admin/players/new/page.js",
    "src/app/admin/coaches/new/page.js",
    "src/app/admin/teams/new/page.js",
  ];

  for (const file of files) {
    const source = read(file);
    assert.match(source, /hasManagedDepartmentRouteMismatch\(scopeContext, requiredDepartment\?\.id\)/, file);
    assert.match(source, /missing-department-scope/, file);
  }
});

test("structure remains superadmin-only before service-role access", () => {
  const page = read("src/app/admin/system/structure/page.js");
  const actions = read("src/app/admin/system/structure/actions.js");
  assert.ok(page.indexOf("assertSuperadminActionPermission") < page.indexOf("createSupabaseAdminClient"));
  assert.equal((actions.match(/assertSuperadminActionPermission/g) || []).length, 3);
  assert.ok(actions.indexOf("assertSuperadminActionPermission") < actions.indexOf("createSupabaseAdminClient"));
});

test("navigation keeps structure superadmin-only and separates department modules", () => {
  const config = read("src/components/admin/navigation/adminNavigation.config.js");
  const resolver = read("src/components/admin/navigation/adminNavigation.resolver.js");
  assert.match(config, /\/admin\/system\/structure[\s\S]*accessPolicy: "superadmin_only"/);
  assert.match(resolver, /accessPolicy !== "superadmin_only"[\s\S]*roleKeys[\s\S]*superadmin/);
  assert.match(resolver, /accessPolicy !== "table_tennis"/);
  assert.match(resolver, /accessPolicy !== "football_modules"/);
});
