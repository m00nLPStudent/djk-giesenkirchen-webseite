import test from "node:test";
import assert from "node:assert/strict";
import { canAccessResultDepartment, canAccessResultTeamSeason, getEffectiveVisibility, isEligibleResultLogo, resolveResultDepartmentSlugs, validateResultInput } from "./results.core.mjs";

const uuid = "11111111-1111-4111-8111-111111111111";
const base = { teamSeasonId: uuid, opponentName: "TTC Beispiel", playedAt: "2026-09-26T18:30", clubScore: 6, opponentScore: 4, clubIsHome: true };
const season = (slug) => ({ id: uuid, is_active: true, seasons: { is_active: true }, teams: { is_active: true, departments: { slug, is_active: true } } });

test("results input validates scores, names and timestamps", () => {
  assert.equal(validateResultInput(base).ok, true);
  assert.equal(validateResultInput({ ...base, clubScore: -1 }).ok, false);
  assert.equal(validateResultInput({ ...base, opponentScore: 1.5 }).ok, false);
  assert.equal(validateResultInput({ ...base, opponentName: " " }).ok, false);
  assert.equal(validateResultInput({ ...base, playedAt: "invalid" }).ok, false);
});

test("visibility override requires a complete ordered pair", () => {
  assert.equal(validateResultInput({ ...base, useVisibilityOverride: true, visibleFrom: "2026-09-26T18:30", visibleUntil: "" }).ok, false);
  assert.equal(validateResultInput({ ...base, useVisibilityOverride: true, visibleFrom: "2026-09-27T18:30", visibleUntil: "2026-09-26T18:30" }).ok, false);
  const valid = validateResultInput({ ...base, useVisibilityOverride: true, visibleFrom: "2026-09-26T18:30", visibleUntil: "2026-09-27T18:30" });
  assert.equal(valid.ok, true);
  assert.ok(valid.value.visibleFrom.endsWith("Z"));
});

test("default visibility ends exactly seven days after played_at", () => {
  const result = getEffectiveVisibility({ played_at: "2026-09-26T16:30:00.000Z" });
  assert.equal(result.start, "2026-09-26T16:30:00.000Z");
  assert.equal(result.end, "2026-10-03T16:30:00.000Z");
  assert.equal(result.isOverride, false);
});

test("home/away mapping remains explicit", () => {
  assert.equal(validateResultInput({ ...base, clubIsHome: true }).value.clubIsHome, true);
  assert.equal(validateResultInput({ ...base, clubIsHome: false }).value.clubIsHome, false);
});

test("result department scope separates technical global roles and department boards", () => {
  assert.deepEqual(resolveResultDepartmentSlugs({ isGlobal: true, roleKeys: ["superadmin"] }), ["fussball", "tischtennis"]);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: ["webmaster"] }), ["fussball", "tischtennis"]);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: ["fussball-vorstand"], managedDepartmentSlug: "fussball" }), ["fussball"]);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: ["tischtennis-vorstand"], managedDepartmentSlug: "tischtennis" }), ["tischtennis"]);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: ["jugendleiter"], canAccessYouthAll: true, roleScopeTypes: ["youth_all"] }), ["fussball"]);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: ["vorstand"] }), []);
  assert.deepEqual(resolveResultDepartmentSlugs({ roleKeys: [], boardRoleSlug: "webmaster" }), []);
});

test("youth results scope allows football and rejects table tennis", () => {
  const youth = { roleKeys: ["jugendleiter"], canAccessYouthAll: true, roleScopeTypes: ["youth_all"] };
  assert.equal(canAccessResultDepartment(youth, "fussball"), true);
  assert.equal(canAccessResultDepartment(youth, "tischtennis"), false);
  assert.equal(canAccessResultTeamSeason(youth, season("fussball")), true);
  assert.equal(canAccessResultTeamSeason(youth, season("tischtennis")), false);
});

test("team-season access is active and department-bound", () => {
  const football = { roleKeys: ["fussball-vorstand"], managedDepartmentSlug: "fussball" };
  assert.equal(canAccessResultDepartment(football, "fussball"), true);
  assert.equal(canAccessResultTeamSeason(football, season("fussball")), true);
  assert.equal(canAccessResultTeamSeason(football, season("tischtennis")), false);
  assert.equal(canAccessResultTeamSeason(football, { ...season("fussball"), is_active: false }), false);
});

test("result logos must match the public result media contract", () => {
  assert.equal(isEligibleResultLogo({ media_kind: "image", visibility: "public", purpose: "result", is_archived: false }), true);
  assert.equal(isEligibleResultLogo({ media_kind: "image", visibility: "admin", purpose: "result", is_archived: false }), false);
  assert.equal(isEligibleResultLogo(null), false);
});
