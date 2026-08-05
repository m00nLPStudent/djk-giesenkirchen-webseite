import test from "node:test";
import assert from "node:assert/strict";
import { buildPlayerAssignedNotification, buildPlayerRemovedNotification, buildPlayerUpdatedNotification, buildTeamArchivedNotification, buildTrainerNotification, chooseSafeTarget, deduplicateRecipients, resolveNotificationTargetForRecipient } from "./assignmentNotification.core.mjs";
import { createNotificationDto } from "./notification.dto.js";

const assignment = { teamId: "team-1", teamSeasonId: "ts-1", teamNameDe: "D2", seasonId: "season-1", seasonName: "2026/27", roleDe: "Co-Trainer" };
const player = { id: "player-1", first_name: "Max", last_name: "Mustermann" };
const coach = { id: "coach-1" };

test("player builders expose assigned, removed and updated events with safe metadata", () => {
  const events = [buildPlayerAssignedNotification({ player, assignment, assignmentId: "a1" }), buildPlayerRemovedNotification({ player, assignment, assignmentId: "a1" }), buildPlayerUpdatedNotification({ player, assignment, assignmentId: "a1" })];
  assert.deepEqual(events.map((item) => item.type), ["player_assigned", "player_removed", "player_updated"]);
  for (const event of events) {
    assert.match(event.message, /Max Mustermann/);
    assert.match(event.message, /D2/);
    assert.match(event.message, /2026\/27/);
    for (const key of ["assignmentAction", "idempotencyKey", "seasonId", "seasonLabel", "teamId", "teamName", "teamSeasonId"]) assert.ok(key in event.metadata);
  }
  assert.equal(events[1].metadata.accessLost, true);
  assert.equal(events[1].metadata.notificationDetailOnly, true);
});

test("trainer builders render role-specific assignment lifecycle", () => {
  const assigned = buildTrainerNotification({ type: "trainer_assigned", coach, assignment, assignmentId: "ca1" });
  const removed = buildTrainerNotification({ type: "trainer_removed", coach, assignment, previousRole: "Co-Trainer", assignmentId: "ca1" });
  const changed = buildTrainerNotification({ type: "trainer_changed", coach, assignment: { ...assignment, roleDe: "Trainer" }, previousRole: "Co-Trainer", assignmentId: "ca1" });
  assert.match(assigned.message, /als Co-Trainer zugeordnet/);
  assert.match(removed.message, /Co-Trainer.*beendet/);
  assert.match(changed.message, /von Co-Trainer zu Trainer/);
});

test("recipient selection removes inactive gaps, duplicates and actor", () => {
  assert.deepEqual(deduplicateRecipients([{ userId: "actor" }, { userId: "u1" }, { userId: "u1" }, {}, { userId: "u2" }], "actor").map((item) => item.userId), ["u1", "u2"]);
});

test("targets require recipient permission and otherwise stay in notification center", () => {
  const event = buildPlayerAssignedNotification({ player, assignment, assignmentId: "a1" });
  assert.equal(chooseSafeTarget({ permissionKeys: ["players.edit"] }, event), "/admin/players/edit/player-1");
  assert.equal(chooseSafeTarget({ permissionKeys: ["teams.view"] }, event), "/admin/teams/team-1");
  assert.equal(chooseSafeTarget({ permissionKeys: [] }, event), "/admin/notifications");
});

test("removed assignments always resolve to the personal notification detail", () => {
  const playerRemoved = buildPlayerRemovedNotification({ player, assignment, assignmentId: "a1" });
  const trainerRemoved = buildTrainerNotification({ type: "trainer_removed", coach, assignment, previousRole: "Co-Trainer", assignmentId: "ca1" });
  for (const event of [playerRemoved, trainerRemoved]) {
    assert.equal(resolveNotificationTargetForRecipient({ permissionKeys: ["players.edit", "teams.view"] }, event), "/admin/notifications");
    assert.equal(event.metadata.accessLost, true);
    assert.match(event.message, /beendet|entfernt/);
  }
});

test("team archives use a detail-only notification without a stale team route", () => {
  const event = buildTeamArchivedNotification({ team: { id: "team-1", name_de: "D2" }, assignment });
  assert.equal(event.title, "Mannschaft archiviert");
  assert.match(event.message, /D2.*2026\/27.*archiviert/);
  assert.equal(event.metadata.notificationDetailOnly, true);
  assert.equal(chooseSafeTarget({ permissionKeys: ["teams.view"] }, event), "/admin/notifications");
});

test("notification DTO repairs legacy removal targets and safely encodes the own id", () => {
  const legacy = createNotificationDto({ id: "notice/1", type: "trainer_removed", target_url: "/admin/teams/team-1" });
  const ordinary = createNotificationDto({ id: "notice-2", type: "trainer_assigned", target_url: "/admin/teams/team-1" });
  assert.equal(legacy.targetUrl, "/admin/notifications?notification=notice%2F1");
  assert.equal(ordinary.targetUrl, "/admin/teams/team-1");
});

test("assigned membership DTO adds the own notification id for safe revocation fallback", () => {
  const dto = createNotificationDto({ id: "notice/1", type: "membership_assigned", entity_type: "membership_request", entity_id: "request/1", metadata: { assignedMembershipRequest: true }, target_url: "/admin/membership-requests/request-1" });
  assert.equal(dto.targetUrl, "/admin/membership-requests/request%2F1?notification=notice%2F1");
});
