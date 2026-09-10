import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ADMIN_NAVIGATION_SECTIONS } from "../navigation/adminNavigation.config.js";
import { resolveAdminNavigation } from "../navigation/adminNavigation.resolver.js";
import { resolveAdminRoutePermission } from "../../../lib/admin-auth/adminPermissionConfig.js";
import { buildMediaAssignmentPayload } from "../media-library/mediaAssignment.core.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("department section navigation is active only with the narrow view permission", () => {
  const allowed = resolveAdminNavigation({
    sections: ADMIN_NAVIGATION_SECTIONS,
    permissionKeys: ["dashboard.view", "department_sections.view", "department_sections.edit"],
    roleKeys: ["vorstand"], scopeContext: { isGlobal: true },
    currentPath: "/admin/behindertensport",
  });
  const section = allowed.sections.find((entry) => entry.key === "disabled_sports");
  assert.deepEqual(section.items.map((item) => item.href), ["/admin/behindertensport"]);
  assert.equal(section.items[0].isActive, true);
  const gymnastics = allowed.sections.find((entry) => entry.key === "gymnastics");
  assert.deepEqual(gymnastics.items.map((item) => item.href), ["/admin/gymnastikdamen"]);

  for (const role of ["fussball-vorstand", "tischtennis-vorstand", "trainer", "betreuer", "kassierer", "webmaster"]) {
    const denied = resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS, permissionKeys: ["dashboard.view"], roleKeys: [role], currentPath: "/admin" });
    assert.equal(denied.sections.some((entry) => entry.key === "disabled_sports"), false, role);
    assert.equal(denied.sections.some((entry) => entry.key === "gymnastics"), false, role);
  }
});

test("route audit maps the direct URL to department_sections.view", () => {
  for (const path of ["/admin/behindertensport", "/admin/gymnastikdamen"]) {
    const route = resolveAdminRoutePermission(path);
    assert.equal(route.matched, true);
    assert.equal(route.permission, "department_sections.view");
  }
});

test("page and every mutation enforce view/edit permissions server-side", async () => {
  const [page, actions, gymnasticsPage, gymnasticsActions, operations, service] = await Promise.all([
    read("../../../app/admin/behindertensport/page.js"),
    read("../../../app/admin/behindertensport/actions.js"),
    read("../../../app/admin/gymnastikdamen/page.js"),
    read("../../../app/admin/gymnastikdamen/actions.js"),
    read("./departmentSection.operations.js"),
    read("./departmentSection.service.js"),
  ]);
  assert.match(page, /requiredPermission: "department_sections\.view"/);
  assert.match(gymnasticsPage, /requiredPermission: "department_sections\.view"/);
  assert.match(page, /redirect\("\/admin\/unauthorized/);
  assert.match(gymnasticsPage, /redirect\("\/admin\/unauthorized/);
  assert.match(operations, /requiredPermission: "department_sections\.edit"/);
  assert.match(actions, /DEPARTMENT_SECTION_CONFIGS\.behindertensport/);
  assert.match(gymnasticsActions, /DEPARTMENT_SECTION_CONFIGS\.gymnastikdamen/);
  assert.match(operations, /resolveActiveDepartmentBySlug\(db, config\.slug\)/);
  assert.doesNotMatch(`${actions}${gymnasticsActions}${operations}`, /input\.department_id|input\.departmentId/);
  assert.match(service, /import "server-only"/);
});

test("training mutations load ownership before update/delete and never accept a client department", async () => {
  const operations = await read("./departmentSection.operations.js");
  assert.match(operations, /loadOwnedTraining\(access, trainingId, config\)/);
  assert.match(operations, /result\.data\.department_id !== access\.department\.id/);
  assert.match(operations, /\.eq\("id", owned\.data\.id\)\.eq\("department_id", access\.department\.id\)/);
  assert.match(operations, /department_id: access\.department\.id/);
});

test("department section images use the central media assignment contract", async () => {
  assert.deepEqual(buildMediaAssignmentPayload("department_section", "section-1", "asset-1", "image"), {
    ok: true,
    payload: { p_entity_type: "department_section", p_entity_id: "section-1", p_media_asset_id: "asset-1", p_field_name: "image" },
  });
  const operations = await read("./departmentSection.operations.js");
  assert.match(operations, /allowedVisibilities: \["public"\]/);
  assert.match(operations, /synchronizeMediaAssignment\("department_section"/);
  assert.match(operations, /visibility: "public"/);
});

test("editor covers empty state, privacy, publication, media and multiple training controls", async () => {
  const editor = await read("./DepartmentSectionEditor.js");
  for (const contract of [
    /Noch keine Section gespeichert/,
    /Kontaktdaten öffentlich anzeigen/,
    /Öffentlich veröffentlicht/,
    /AdminMediaPicker/,
    /Trainingszeit hinzufügen/,
    /Deaktivieren/,
    /Löschen/,
  ]) assert.match(editor, contract);
  assert.doesNotMatch(editor, /@\/app\/admin\/behindertensport\/actions/);
  assert.match(editor, /actions \}/);
});
