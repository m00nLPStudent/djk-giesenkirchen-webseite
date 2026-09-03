import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_NAVIGATION_SECTIONS } from "./adminNavigation.config.js";
import { ADMIN_NAVIGATION_ICON_KEYS, getAdminNavigationIcon } from "./adminNavigation.icons.js";
import {
  getAdminNavigationSurfaceState,
  getInitialOpenSectionKeys,
  getNavigationResponsiveMode,
  getNextNavigationIndex,
} from "./adminNavigation.uiCore.js";
import { resolveAdminNavigation } from "./adminNavigation.resolver.js";
import { applyActivePathToNavigationDto } from "./adminNavigation.matching.js";

const activeItems = ADMIN_NAVIGATION_SECTIONS.flatMap((section) =>
  section.items.filter((item) => item.implementationStatus === "active"),
);
const permissions = [...new Set(activeItems.flatMap((item) => [
  item.permissionKey, ...(item.permissionKeys || []),
]).filter(Boolean))];
const baseDto = resolveAdminNavigation({
  sections: ADMIN_NAVIGATION_SECTIONS,
  permissionKeys: permissions,
  roleKeys: ["superadmin"],
  scopeContext: { isGlobal: true, roleScopeTypes: ["global"] },
});

test("canonical navigation has no sidebar or feature-flag mixed state", () => {
  assert.deepEqual(getAdminNavigationSurfaceState(), {
    sidebarVisible: false,
    sidebarWidthReserved: false,
    horizontalVisible: true,
    mobileDrawerAvailable: true,
    mobileMenuButtonCount: 1,
  });
});

test("responsive mode switches before horizontal labels become crowded", () => {
  assert.equal(getNavigationResponsiveMode(1279), "mobile");
  assert.equal(getNavigationResponsiveMode(1280), "desktop");
  for (const width of [1180, 1024, 900, 768, 430, 375]) assert.equal(getNavigationResponsiveMode(width), "mobile");
  for (const width of [1920, 1440, 1280]) assert.equal(getNavigationResponsiveMode(width), "desktop");
});

test("all configured icon keys resolve and unknown keys use a fallback", () => {
  const configured = ADMIN_NAVIGATION_SECTIONS.flatMap((section) => [
    section.iconKey, ...section.items.map((item) => item.iconKey),
  ]);
  for (const key of configured) assert.equal(typeof getAdminNavigationIcon(key), "object");
  assert.ok(ADMIN_NAVIGATION_ICON_KEYS.length > 0);
  assert.equal(typeof getAdminNavigationIcon("unknown-icon"), "object");
});

test("active route is derived from B15.2 matching without mutating the DTO", () => {
  const before = JSON.stringify(baseDto);
  const playerDto = applyActivePathToNavigationDto(baseDto, "/admin/football/players/new");
  assert.equal(playerDto.activeSectionKey, "football");
  assert.equal(playerDto.activeItemKey, "players");
  assert.equal(JSON.stringify(baseDto), before);
  assert.equal(playerDto.sections.flatMap((section) => section.items).filter((item) => item.isActive).length, 1);
});

test("active mobile section starts expanded and focus navigation wraps", () => {
  const dto = applyActivePathToNavigationDto(baseDto, "/admin/news");
  assert.deepEqual(getInitialOpenSectionKeys(dto), ["club"]);
  assert.equal(getNextNavigationIndex(0, 3, -1), 2);
  assert.equal(getNextNavigationIndex(2, 3, 1), 0);
});

test("moved routes activate their new sections on desktop and mobile", () => {
  const department = applyActivePathToNavigationDto(baseDto, "/admin/football/board/edit/test-id");
  assert.equal(department.activeSectionKey, "football");
  assert.equal(department.activeItemKey, "department");
  const users = applyActivePathToNavigationDto(baseDto, "/admin/users");
  assert.equal(users.activeSectionKey, "system");
  assert.equal(users.activeItemKey, "users");
  assert.deepEqual(getInitialOpenSectionKeys(users), ["system"]);
  const superadminDto = resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS, permissionKeys: permissions, roleKeys: ["superadmin"], scopeContext: { isGlobal: true, roleScopeTypes: ["global"] } });
  const emailSettings = applyActivePathToNavigationDto(superadminDto, "/admin/system/notification-email-settings");
  assert.equal(emailSettings.activeSectionKey, "system");
  assert.equal(emailSettings.activeItemKey, "notification-email-settings");
  const structure = applyActivePathToNavigationDto(superadminDto, "/admin/system/structure");
  assert.equal(structure.activeSectionKey, "system");
  assert.equal(structure.activeItemKey, "structure-assignment");
});

test("runtime DTO has no planned links and no auth or service data", () => {
  const serialized = JSON.stringify(baseDto);
  assert.ok(baseDto.sections.every((section) => section.items.every((item) => item.status === "active" && item.href)));
  assert.ok(!serialized.includes("permissionKeys"));
  assert.ok(!serialized.includes("service_role"));
  assert.ok(!serialized.includes("assignedTeamIds"));
});
