import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [placeholder, core, picker, mediaTab, adminList, adminDetail, publicCard, publicHero] = await Promise.all([
  read("../../website/team/TeamImagePlaceholder.js"), read("../../../lib/football/publicTeamImage.core.mjs"),
  read("./AdminMediaPicker.js"), read("../teams/forms/tabs/TeamMediaTab.js"),
  read("../teams/AdminTeamsList.js"), read("../teams/components/TeamContributionDetailView.js"),
  read("../../website/football/FootballTeamCard.js"), read("../../website/team/TeamHero.js"),
]);

test("the final local placeholder exists and is rendered through next image", async () => {
  const file = await stat(new URL("../../../../public/images/placeholders/team-placeholder.webp", import.meta.url));
  assert.ok(file.isFile());
  assert.ok(file.size > 0);
  assert.match(core, /TEAM_PLACEHOLDER_ASSET_PATH = "\/images\/placeholders\/team-placeholder\.webp"/);
  assert.match(placeholder, /import Image from "next\/image"/);
  assert.match(placeholder, /fill sizes=\{sizes\}/);
  assert.match(placeholder, /Mannschaftsbild nicht verfügbar/);
});

test("all team fallback surfaces use the central component", () => {
  assert.match(mediaTab, /placeholder=\{<TeamImagePlaceholder/);
  assert.match(picker, /placeholder \|\| <span/);
  assert.match(adminList, /!team\.resolved_team_image_url[\s\S]*<TeamImagePlaceholder/);
  assert.match(adminDetail, /!team\.team_image_url[\s\S]*<TeamImagePlaceholder/);
  assert.match(publicCard, /<TeamImagePlaceholder/);
  assert.match(publicHero, /<TeamImagePlaceholder/);
});

test("placeholder remains presentation-only", () => {
  const sources = placeholder + core + mediaTab + adminList + adminDetail + publicCard + publicHero;
  assert.doesNotMatch(sources, /media_assets|media_asset_usages|synchronizeMediaAssignment|supabase|\.from\(/);
  assert.doesNotMatch(mediaTab, /team_image_media_asset_id:\s*TEAM_PLACEHOLDER/);
});
