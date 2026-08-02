import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const action = read("../../../app/admin/coaches/actions.js");
const detail = read("../coaches/components/CoachDetailOverview.js");
const button = read("./ArchiveButton.js");

test("coach action keeps existing permission and scope guards but no hard delete RPC", () => {
  assert.match(action, /requiredPermission: "coaches.delete"/);
  assert.match(action, /canDeleteCoachOnServer/);
  assert.match(action, /archiveCoach\(supabaseServer, coachId\)/);
  assert.doesNotMatch(action, /entity_type: "coach"/);
});

test("coach archive is available only in the danger zone", () => {
  const header = detail.slice(detail.indexOf("header={<AdminDetailHeader"), detail.indexOf("dangerZone={dangerZone}"));
  assert.doesNotMatch(header, /ArchiveButton|archivieren/);
  assert.match(detail, /AdminDangerZone title="Trainer archivieren"/);
  assert.match(detail, /<ArchiveButton entity="coach"/);
  assert.doesNotMatch(detail, /dauerhaft|AdminRemoveButton/);
});

test("coach confirmation explains deactivation history and no reassignment", () => {
  assert.match(button, /Der Trainer wird deaktiviert/);
  assert.match(button, /Historie bleibt vollständig erhalten/);
  assert.match(button, /keine Mannschaftszuordnung automatisch wieder her/);
});

test("successful archive revalidates admin and public coach surfaces", () => {
  for (const marker of ["/admin/coaches", "/admin/teams", 'revalidatePublicContent("coaches")', 'revalidatePublicContent("teams")', 'revalidatePublicContent("contacts")']) assert.ok(action.includes(marker));
});
