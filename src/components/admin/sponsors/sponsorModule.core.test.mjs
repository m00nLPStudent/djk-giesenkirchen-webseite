import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helperSource = fs.readFileSync(new URL("./sponsorUi.helpers.js", import.meta.url), "utf8");
const helpers = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString("base64")}`);
const sponsors = [
  { id: "1", name: "Alpha", is_active: true, image_url: "/alpha.png", website_url: "https://alpha.test", sponsor_categories: { name_de: "Gold" } },
  { id: "2", name: "Beta", is_active: false, image_url: "", website_url: "", sponsor_categories: null },
];

test("summary uses only reliable existing sponsor fields", () => {
  assert.deepEqual(helpers.getSponsorSummary(sponsors), { total: 2, active: 1, inactive: 1, withoutLogo: 1 });
});

test("search and active status filter preserve existing sort order", () => {
  assert.deepEqual(helpers.filterSponsors(sponsors, { status: "inactive" }).map((item) => item.id), ["2"]);
  assert.deepEqual(helpers.filterSponsors(sponsors, { search: "gold" }).map((item) => item.id), ["1"]);
});

test("website links accept only explicit HTTP and HTTPS URLs", () => {
  assert.equal(helpers.getSafeSponsorWebsiteUrl("https://example.test/path"), "https://example.test/path");
  assert.equal(helpers.getSafeSponsorWebsiteUrl("http://example.test"), "http://example.test/");
  for (const value of ["", "not a url", "javascript:alert(1)", "data:text/html,test"]) assert.equal(helpers.getSafeSponsorWebsiteUrl(value), null);
});

test("status mapping contains only the existing active and inactive values", () => {
  assert.deepEqual(helpers.getSponsorStatus({ is_active: true }), { label: "Aktiv", variant: "success" });
  assert.deepEqual(helpers.getSponsorStatus({ is_active: false }), { label: "Inaktiv", variant: "warning" });
});
