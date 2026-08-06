import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repository = await readFile(new URL("./teamNotificationRecipients.repository.js", import.meta.url), "utf8");
const service = await readFile(new URL("./teamAssignmentNotifications.service.js", import.meta.url), "utf8");
const playerAction = await readFile(new URL("../../../app/admin/players/actions.js", import.meta.url), "utf8");

test("empty player-assignment recipient results keep the complete source contract", () => {
  assert.match(repository, /function emptyTeamRecipientSource\(\)/);
  for (const field of ["assignments", "coaches", "profiles", "roleLinks", "rolePermissions", "permissions"]) {
    assert.match(repository, new RegExp(`${field}: \\[\\]`));
  }
  assert.equal((repository.match(/data: emptyTeamRecipientSource\(\)/g) || []).length, 3);
  assert.match(service, /source\.permissions\.map/);
});

test("player create reports unexpected server failures without exposing raw exceptions", () => {
  assert.match(playerAction, /console\.error\("\[save-player\]"/);
  assert.match(playerAction, /Der Spieler konnte nicht gespeichert werden\. Bitte versuche es erneut\./);
  assert.doesNotMatch(playerAction, /return buildError\(\s*error\?\.message/);
});
