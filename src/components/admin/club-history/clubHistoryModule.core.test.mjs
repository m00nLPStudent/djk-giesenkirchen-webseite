import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const form = read("./forms/ClubHistoryEditorForm.js");
const images = read("./components/ClubHistoryImagesManager.js");
const milestones = read("./components/ClubHistoryMilestonesManager.js");
const service = read("./services/clubHistory.service.js");

test("hidden English page values remain in state and the unchanged save payload", () => {
  for (const field of ["title_en", "teaser_en", "content_en"]) {
    assert.match(form, new RegExp(`${field}: page\\?\\.${field} \\|\\| ""`));
    assert.match(form, new RegExp(`${field}: form\\.${field}`));
  }
  assert.doesNotMatch(form, /label="(?:Title|Teaser|Content) \(EN\)"/);
});

test("hidden English media values remain part of existing create and update payloads", () => {
  for (const field of ["alt_text_en", "caption_en"]) assert.ok(images.includes(`${field}: item.${field}`));
  assert.doesNotMatch(images, /label="(?:Alt Text|Caption) \(EN\)"/);
  assert.match(milestones, /description_en: item\.description_en/);
  assert.doesNotMatch(milestones, /label="Description \(EN\)"/);
});

test("queries, upload and write functions remain unchanged in the service", () => {
  for (const table of ["club_history_pages", "club_history_images", "club_history_milestones"]) assert.ok(service.includes(`.from("${table}")`));
  for (const operation of ["uploadMediaFile", "deleteMediaFile", "upsertClubHistoryPage", "updateClubHistoryImage", "updateClubHistoryMilestone"]) assert.ok(service.includes(operation));
});
