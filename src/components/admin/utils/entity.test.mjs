import test from "node:test";
import assert from "node:assert/strict";
import { getEntityImage, getEntityTeam } from "./entity.js";

test("getEntityTeam prefers seasonal dto fields before shared fallbacks", () => {
  const team = getEntityTeam({
    primaryAssignment: {
      teamId: "team-1",
      teamNameDe: "U17",
      teamSlug: "u17",
    },
    team_id: "legacy-team",
    team_name: "Legacy Team",
  });

  assert.deepEqual(team, {
    id: "team-1",
    name: "U17",
    slug: "u17",
  });
});

test("getEntityTeam no longer depends on coach team_name snapshots", () => {
  const team = getEntityTeam({
    team_id: "legacy-team",
    team_name: "Legacy Team",
  });

  assert.deepEqual(team, {
    id: "legacy-team",
    name: "Keine Mannschaft",
    slug: null,
  });
});

test("getEntityTeam can disable the legacy team_id fallback for seasonal-only callers", () => {
  const team = getEntityTeam(
    {
      team_id: "legacy-team",
      team_name: "Legacy Team",
    },
    { includeLegacyTeamId: false },
  );

  assert.deepEqual(team, {
    id: null,
    name: "Keine Mannschaft",
    slug: null,
  });
});

test("getEntityImage keeps photo_url as a fallback behind canonical image fields", () => {
  assert.equal(
    getEntityImage(
      {
        imageUrl: "https://example.test/normalized.png",
        image_url: "https://example.test/canonical.png",
        photo_url: "https://example.test/legacy.png",
      },
      "fallback.png",
    ),
    "https://example.test/normalized.png",
  );

  assert.equal(
    getEntityImage({ photo_url: "https://example.test/legacy.png" }, "fallback.png"),
    "https://example.test/legacy.png",
  );
});
