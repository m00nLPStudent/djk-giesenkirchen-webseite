import test from "node:test";
import assert from "node:assert/strict";
import { filterStructureItems, isUnassignedStructureRecord, normalizeStructureAssignmentInput, normalizeStructureRelationConflict, resolveStructureRecordScope, validateRelationCompatibility } from "./structureAssignment.core.mjs";

test("normalizes department assignments and permits club only for board", () => {
  assert.deepEqual(normalizeStructureAssignmentInput({ entityType: "player", entityId: "p1", departmentId: "d1" }), { ok: true, data: { entityType: "player", entityId: "p1", targetType: "department", departmentId: "d1" } });
  assert.equal(normalizeStructureAssignmentInput({ entityType: "player", entityId: "p1", targetType: "club" }).ok, false);
  assert.equal(normalizeStructureAssignmentInput({ entityType: "board", entityId: "b1", targetType: "club" }).ok, true);
});

test("relation conflicts distinguish unassigned and cross-department people", () => {
  const base = { id: "rel-1", team_seasons: { name_de: "D2", teams: { name_de: "D2", department_id: "football", departments: { name_de: "Fußball" } } } };
  const unassigned = normalizeStructureRelationConflict("player", { ...base, players: { id: "p1", first_name: "Test", department_id: null } });
  assert.equal(unassigned.entityId, "p1");
  assert.match(unassigned.reason, /keiner Abteilung/);
  const mismatch = normalizeStructureRelationConflict("coach", { ...base, coaches: { id: "c1", name: "Coach", department_id: "tt", departments: { name_de: "Tischtennis" } } });
  assert.match(mismatch.reason, /stimmen nicht überein/);
  assert.equal(normalizeStructureRelationConflict("player", { ...base, players: { id: "p2", department_id: "football" } }), null);
});

test("relation compatibility fails closed for foreign and unresolved relations", () => {
  assert.equal(validateRelationCompatibility("football", []).ok, true);
  assert.equal(validateRelationCompatibility("football", ["football", "football"]).ok, true);
  assert.equal(validateRelationCompatibility("football", ["table-tennis"]).ok, false);
  assert.equal(validateRelationCompatibility("football", [null]).ok, false);
});

test("unassigned contract distinguishes board club from unassigned", () => {
  assert.equal(isUnassignedStructureRecord("player", { department_id: null }), true);
  assert.equal(isUnassignedStructureRecord("player", { department_id: "d1" }), false);
  assert.equal(isUnassignedStructureRecord("board", { organization_scope: "unassigned", department_id: null }), true);
  assert.equal(isUnassignedStructureRecord("board", { organization_scope: "club", department_id: null }), false);
});

test("player structure scope separates department assignment from current team assignment", () => {
  const active = { id: "active", department_id: "football", is_active: true };
  const inactive = { id: "inactive", department_id: "football", is_active: false };
  assert.equal(resolveStructureRecordScope("player", active, []), "teamless");
  assert.equal(resolveStructureRecordScope("player", inactive, []), "teamless");
  assert.equal(resolveStructureRecordScope("player", { id: "none", department_id: null }, []), "unassigned");
  assert.equal(resolveStructureRecordScope("player", active, [{ playerId: "active", departmentId: "football" }]), "department");
  assert.equal(resolveStructureRecordScope("player", active, [{ playerId: "active", departmentId: "football" }, { playerId: "active", departmentId: "football" }]), "department");
  assert.equal(resolveStructureRecordScope("player", active, [{ playerId: "active", departmentId: "table-tennis" }]), "conflict");
});

test("structure filters keep active and inactive teamless players administratively reachable", () => {
  const items = [
    { id: "active", type: "player", scope: "teamless", is_active: true },
    { id: "inactive", type: "player", scope: "teamless", is_active: false },
  ];
  assert.deepEqual(filterStructureItems(items, { scope: "teamless", status: "all" }).map((item) => item.id), ["active", "inactive"]);
  assert.deepEqual(filterStructureItems(items, { scope: "teamless", status: "active" }).map((item) => item.id), ["active"]);
  assert.deepEqual(filterStructureItems(items, { scope: "teamless", status: "inactive" }).map((item) => item.id), ["inactive"]);
});
