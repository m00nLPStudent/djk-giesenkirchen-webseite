import assert from "node:assert/strict";
import test from "node:test";
import { createTeamTypeForm, filterTeamTypes, getTeamTypeMutationErrorMessage, isTeamTypeUsed, normalizeTeamTypePayload, sortTeamTypes } from "./teamTypes.core.js";

test("team type form and payload use only existing columns", () => { const form = createTeamTypeForm({ name_de: "D2-Jugend", slug: "D2", age_group: "Jugend", sort_order: 4, is_active: false }); assert.deepEqual(normalizeTeamTypePayload(form), { name_de: "D2-Jugend", slug: "d2", age_group: "Jugend", sort_order: 4, is_active: false }); });
test("team types sort only by sort order and filter status", () => { const rows = [{ id: "b", sort_order: 20, is_active: false }, { id: "a", sort_order: 2, is_active: true }]; assert.deepEqual(sortTeamTypes(rows).map((item) => item.id), ["a", "b"]); assert.deepEqual(filterTeamTypes(rows, "active").map((item) => item.id), ["a"]); });
test("usage protection recognizes copied slug or display name", () => { const template = { slug: "d2", name_de: "D2-Jugend" }; assert.equal(isTeamTypeUsed(template, [{ slug: "d2", name_de: "Alt" }]), true); assert.equal(isTeamTypeUsed(template, [{ slug: "other", name_de: "D2-Jugend" }]), true); assert.equal(isTeamTypeUsed(template, [{ slug: "e1", name_de: "E1" }]), false); });
test("mutation errors never expose the raw RLS message", () => { const message = getTeamTypeMutationErrorMessage({ message: "new row violates row-level security policy" }); assert.doesNotMatch(message, /row-level|policy/i); assert.match(message, /Berechtigung/); });
