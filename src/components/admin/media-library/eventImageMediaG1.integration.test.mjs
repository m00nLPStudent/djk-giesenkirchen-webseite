import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/events/actions.js");
const editor = read("../events/forms/EventEditorForm.js");
const mediaTab = read("../events/forms/tabs/EventMediaTab.js");
const publicCard = read("../../website/events/EventCard.js");
const publicDetail = read("../../../app/(website)/termine/[slug]/page.js");
const publicList = read("../../../app/(website)/termine/allgemein/page.js");
const home = read("../../../app/(website)/page.js");
const resolver = read("../events/services/eventMedia.service.js");
const assignment = read("./mediaAssignment.core.mjs");
const proposal = read("../../../../docs/sql/b15-19g1-event-image-media-reference-proposal.sql");
const rollback = read("../../../../docs/sql/b15-19g1-event-image-media-reference-rollback.sql");

test("event editor uses the central picker and no legacy browser image upload", () => {
  assert.match(mediaTab, /AdminMediaPicker/);
  assert.match(mediaTab, /usageContext="event"/);
  assert.match(editor, /loadEventMediaPickerAction/);
  assert.doesNotMatch(editor, /uploadEventImage/);
});

test("event actions validate, upload and synchronize centrally", () => {
  assert.match(actions, /resolveEntityImageMedia/);
  assert.match(actions, /uploadMediaAsset/);
  assert.match(actions, /purpose: "event"/);
  assert.match(actions, /synchronizeMediaAssignment\("event"/);
  assert.match(actions, /\["public", "admin"\]/);
  assert.doesNotMatch(actions, /restricted/);
  assert.match(assignment, /"event"/);
});

test("public event views batch-resolve event media while home uses virtual trainings only", () => {
  assert.match(resolver, /loadPublicMediaUrlMap/);
  assert.match(resolver, /resolveLoadedPublicMediaImage/);
  assert.match(publicList, /resolvePublicEventImages/);
  assert.doesNotMatch(home, /resolvePublicEventImages/);
  assert.match(home, /getVirtualTrainingEvents/);
  assert.match(home, /selectUpcomingHomeTrainings/);
  assert.match(publicDetail, /resolved_image_url \|\| event\.image_url/);
  assert.match(publicCard, /resolved_image_url \|\| event\.image_url/);
});

test("SQL preserves prior targets and adds event cleanup without storage deletion", () => {
  for (const target of ["coach", "player", "board_member", "club_contact", "team", "team_season", "news", "news_document", "event"]) assert.match(proposal, new RegExp(`'${target}'`));
  assert.match(proposal, /ON DELETE SET NULL/);
  assert.match(proposal, /entity_type='event'/);
  assert.match(proposal, /TO service_role/);
  assert.doesNotMatch(proposal, /UPDATE public\.events SET image_url|storage\./);
  assert.match(rollback, /Restores the B15\.19F2 assignment scope/);
  assert.doesNotMatch(rollback, /storage\./);
});
