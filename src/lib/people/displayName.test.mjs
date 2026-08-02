import assert from "node:assert/strict";
import test from "node:test";
import { resolvePersonDisplayName } from "./displayName.js";

test("person display name follows the canonical fallback order", () => {
  assert.equal(resolvePersonDisplayName({ displayName: "Coach DTO", full_name: "Alt Name" }), "Coach DTO");
  assert.equal(resolvePersonDisplayName({ full_name: "Voller Name" }), "Voller Name");
  assert.equal(resolvePersonDisplayName({ first_name: "Mara", last_name: "Muster" }), "Mara Muster");
  assert.equal(resolvePersonDisplayName({ firstName: "DTO", lastName: "Coach" }), "DTO Coach");
  assert.equal(resolvePersonDisplayName({ name: "Vorstand Name" }), "Vorstand Name");
  assert.equal(resolvePersonDisplayName({}), "Unbekannte Person");
});
