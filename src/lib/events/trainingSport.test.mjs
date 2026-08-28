import assert from "node:assert/strict";
import test from "node:test";
import { resolveTrainingSport } from "./trainingSport.mjs";

test("training sport resolves existing department slugs", () => {
  assert.equal(resolveTrainingSport({ department_slug: "fussball" }), "football");
  assert.equal(resolveTrainingSport({ department_slug: "tischtennis" }), "table-tennis");
  assert.equal(resolveTrainingSport({ department_slug: "damen-gymnastik" }), "gymnastics");
  assert.equal(resolveTrainingSport({ department_slug: "behindertensport" }), "inclusive-sports");
});

test("training sport fails safely for absent or unknown departments", () => {
  assert.equal(resolveTrainingSport({}), "unknown");
  assert.equal(resolveTrainingSport({ department_slug: "unbekannt" }), "unknown");
});
