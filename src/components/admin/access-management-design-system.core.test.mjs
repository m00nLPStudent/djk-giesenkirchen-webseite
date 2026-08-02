import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("users, roles and permissions use the shared module shell", () => {
  for (const path of [
    "./users/components/AdminUsersPageShell.js",
    "./roles/components/AdminRolesPageShell.js",
    "./permissions/components/AdminPermissionsPageShell.js",
  ]) {
    const source = read(path);
    assert.match(source, /AdminModulePage/);
    assert.doesNotMatch(source, /AdminPageHeader/);
  }
});

test("module searches live in shared headers and filters are shared", () => {
  for (const path of [
    "./users/components/UsersToolbar.js",
    "./roles/components/RolesToolbar.js",
    "./permissions/components/PermissionsToolbar.js",
  ]) {
    const source = read(path);
    assert.match(source, /AdminModuleHeader/);
    assert.match(source, /AdminModuleSearch/);
    assert.match(source, /AdminModuleFilters/);
  }
});

test("lists switch from cards to tables at xl and use shared empty states", () => {
  for (const path of [
    "./users/components/UsersTable.js",
    "./roles/components/RolesTable.js",
    "./permissions/components/PermissionsTable.js",
  ]) {
    const source = read(path);
    assert.match(source, /AdminModuleEmptyState/);
    assert.match(source, /hidden xl:block/);
    assert.match(source, /xl:hidden/);
    assert.doesNotMatch(source, /overflow-x-auto/);
  }
});

test("permission matrix uses the shared header search", () => {
  const source = read("./permissions/components/PermissionMatrix.js");
  assert.match(source, /AdminModuleHeader/);
  assert.match(source, /AdminModuleSearch/);
  assert.doesNotMatch(source, /AdminPageHeader/);
});

test("status changes live in detail danger zones, not list actions", () => {
  for (const path of [
    "./users/dialogs/UserDetailsDialog.js",
    "./roles/components/RoleDetailsDialog.js",
  ]) {
    assert.match(read(path), /AdminDangerZone/);
  }
  assert.doesNotMatch(read("./users/components/UsersTable.js"), /onToggleStatus\(/);
  assert.doesNotMatch(read("./roles/components/RolesTable.js"), /onToggleStatus\(/);
});
