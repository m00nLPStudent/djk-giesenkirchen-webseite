import test from "node:test";
import assert from "node:assert/strict";
import { getTeamCoachNameLines } from "./teamCoachCard.core.mjs";

test("short and long coach names always use explicit first and last-name lines", () => {
  assert.deepEqual(
    getTeamCoachNameLines({ firstName: "Kai", lastName: "Kurz" }),
    { firstName: "Kai", lastName: "Kurz" },
  );
  assert.deepEqual(
    getTeamCoachNameLines({
      firstName: "Alexandra",
      lastName: "Beispielhausen",
    }),
    { firstName: "Alexandra", lastName: "Beispielhausen" },
  );
});

test("legacy display names retain a stable two-line name block", () => {
  assert.deepEqual(getTeamCoachNameLines({ displayName: "Mira Muster" }), {
    firstName: "Mira",
    lastName: "Muster",
  });
  assert.equal(getTeamCoachNameLines({ displayName: "Mira" }).lastName, "\u00a0");
});
