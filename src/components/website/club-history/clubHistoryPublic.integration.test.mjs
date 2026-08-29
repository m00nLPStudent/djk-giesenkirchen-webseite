import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { decodeHistoryTextEntities, isPublicClubHistoryPage } from "./clubHistoryPublic.core.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const renderer = read("src/components/website/club-history/ClubHistoryPublicPage.js");
const clubRoute = read("src/app/(website)/verein/vereinsgeschichte/page.js");
const footballRoute = read("src/app/(website)/fussball/vereinsgeschichte/page.js");
const service = read("src/components/admin/club-history/services/clubHistory.service.js");

test("publication state excludes drafts, inactive and future history pages", () => {
  const now = new Date("2026-08-29T12:00:00Z").getTime();
  assert.equal(isPublicClubHistoryPage(null, now), false);
  assert.equal(isPublicClubHistoryPage({ is_active: true, is_published: false }, now), false);
  assert.equal(isPublicClubHistoryPage({ is_active: false, is_published: true }, now), false);
  assert.equal(isPublicClubHistoryPage({ is_active: true, is_published: true, published_at: "2026-08-30T00:00:00Z" }, now), false);
  assert.equal(isPublicClubHistoryPage({ is_active: true, is_published: true, published_at: "2026-08-28T00:00:00Z" }, now), true);
});

test("global route loads the confirmed singleton and only real related content", () => {
  assert.match(service, /CLUB_HISTORY_PAGE_KEY = "fussball-vereinsgeschichte"/);
  assert.match(renderer, /eq\("page_key", CLUB_HISTORY_PAGE_KEY\)/);
  assert.match(renderer, /eq\("is_active", true\)/);
  assert.match(renderer, /eq\("is_published", true\)/);
  assert.match(renderer, /club_history_images/);
  assert.match(renderer, /club_history_milestones/);
  assert.doesNotMatch(renderer, /order\("updated_at"[\s\S]*limit\(1\)/);
  assert.doesNotMatch(renderer, /Gründung und Entwicklung|Historische Bilder und Dokumente/);
  assert.match(clubRoute, /ClubHistoryPublicPage/);
});

test("missing content has a neutral empty state and the football legacy URL remains safe", () => {
  assert.match(renderer, /Die Vereinsgeschichte ist derzeit noch nicht veröffentlicht/);
  assert.match(footballRoute, /permanentRedirect\("\/verein\/vereinsgeschichte"\)/);
});

test("legacy history entities decode once without enabling HTML", () => {
  assert.equal(decodeHistoryTextEntities("&uuml;ber Fu&szlig;ball &amp; Verein"), "über Fußball & Verein");
  assert.equal(decodeHistoryTextEntities("Über den Verein"), "Über den Verein");
  assert.equal(decodeHistoryTextEntities("&unknown; &broken"), "&unknown; &broken");
  assert.equal(decodeHistoryTextEntities("&amp;uuml;"), "&uuml;");
  assert.equal(decodeHistoryTextEntities("<script>alert(1)</script>"), "<script>alert(1)</script>");
  assert.match(renderer, /<RichTextContent content=\{content\}/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML/);
});
