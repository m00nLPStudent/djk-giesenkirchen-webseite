import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");

test("all public player views use the shared privacy formatter", async () => {
  const [card, profileHelpers, tableTennisCore] = await Promise.all([
    read("components/website/team/TeamPlayerCard.js"),
    read("components/website/player-profile/playerProfile.helpers.js"),
    read("components/website/table-tennis/tableTennisPublic.core.mjs"),
  ]);

  for (const source of [card, profileHelpers, tableTennisCore]) {
    assert.match(source, /formatPublicPlayerName/);
  }
  assert.doesNotMatch(card, /`\$\{player\.first_name[^\n]*player\.last_name/);
  assert.doesNotMatch(tableTennisCore, /`\$\{player\.first_name[^\n]*player\.last_name/);
});

test("admin player name rendering remains the full-name contract", async () => {
  const adminEntity = await read("components/admin/utils/entity.js");

  assert.match(adminEntity, /entity\.first_name \|\| entity\.firstName/);
  assert.match(adminEntity, /entity\.last_name \|\| entity\.lastName/);
  assert.doesNotMatch(adminEntity, /formatPublicPlayerName/);
});
