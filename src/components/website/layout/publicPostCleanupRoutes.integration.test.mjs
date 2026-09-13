import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

const dynamicDatabaseRoutes = [
  "src/app/(website)/termine/allgemein/page.js",
  "src/app/(website)/fussball/mannschaften/page.js",
  "src/app/(website)/fussball/mannschaften/senioren/page.js",
  "src/app/(website)/fussball/mannschaften/damen/page.js",
  "src/app/(website)/fussball/mannschaften/junioren/page.js",
  "src/app/(website)/tischtennis/vorstand/page.js",
  "src/app/(website)/kontakt/page.js",
  "src/app/(website)/fussball/sponsoren/page.js",
];

test("database-backed public list routes render at request time", () => {
  for (const path of dynamicDatabaseRoutes) {
    const source = read(path);
    assert.match(source, /import \{ connection \} from "next\/server"/i, path);
    assert.match(source, /await connection\(\)/, path);
  }
});

test("empty event, team, board and contact states remain explicit", () => {
  assert.match(read(dynamicDatabaseRoutes[0]), /keine kommenden allgemeinen Termine/);
  assert.match(read(dynamicDatabaseRoutes[2]), /keine Senioren-Mannschaften/);
  assert.match(read(dynamicDatabaseRoutes[3]), /keine Damen-Mannschaften/);
  assert.match(read(dynamicDatabaseRoutes[4]), /keine Junioren-Mannschaften/);
  assert.match(read(dynamicDatabaseRoutes[5]), /keine öffentlichen Vorstandsangaben/);
  assert.match(read(dynamicDatabaseRoutes[6]), /Noch keine allgemeinen Kontakte/);
  assert.match(read("src/components/website/department/DepartmentPersonGrid.js"), /Children\.count\(children\) === 0/);
  assert.match(read(dynamicDatabaseRoutes[7]), /resolvedSponsors\.length === 0/);
  assert.match(read(dynamicDatabaseRoutes[7]), /Aktuell sind keine Sponsoren veröffentlicht/);
});

test("public loaders keep database sources and do not introduce fallback records", () => {
  const combined = dynamicDatabaseRoutes.map(read).join("\n");
  for (const relation of ["events", "teams", "board_members", "club_contacts", "sponsors"]) {
    const relatedSources = [combined, read("src/lib/football/teams.js"), read("src/components/website/table-tennis/tableTennisPublic.repository.js"), read("src/components/admin/events/services/events.service.js")].join("\n");
    assert.match(relatedSources, new RegExp(`(?:from\\(\\\"${relation}\\\"\\)|getPublishedEvents|getActiveFootballTeams|loadPublicTableTennisBoard)`), relation);
  }
  assert.doesNotMatch(combined, /mock|fixture|demo data/i);
});
