import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createPublicNewsCardDto, getNewsCategoryDisplay, resolveNewsCategoryLabel, UNKNOWN_NEWS_CATEGORY } from "./helpers/newsCategories.core.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const categories = [{ id: "2", slug: "verein", name_de: "Verein", is_active: true, sort_order: 20 }, { id: "1", slug: "fussball", name_de: "Fußball", is_active: true, sort_order: 10 }];

test("category labels resolve only by category key with a safe historical fallback", () => {
  assert.equal(resolveNewsCategoryLabel(categories, "verein"), "Verein");
  assert.equal(resolveNewsCategoryLabel(categories, "legacy"), UNKNOWN_NEWS_CATEGORY);
  assert.equal(getNewsCategoryDisplay({ category_key: "legacy", category: "Legacy Label" }, categories), UNKNOWN_NEWS_CATEGORY);
  assert.equal(getNewsCategoryDisplay({ category_key: "fussball", football_team: { name_de: "E1" } }, categories), "Fußball · E1");
});

test("public card DTO normalizes snake case once before rendering", () => {
  const dto = createPublicNewsCardDto({ id: "1", slug: "meldung", title_de: "Titel", teaser_de: "Text", category_key: "tischtennis" }, [{ slug: "tischtennis", name_de: "Tischtennis" }]);
  assert.equal(dto.categoryKey, "tischtennis");
  assert.equal(dto.categoryLabel, "Tischtennis");
  assert.equal(dto.title, "Titel");
  assert.equal("category_key" in dto, false);
});

test("public card renders only the normalized category label", () => {
  const card = read("../../website/news/NewsCard.js");
  assert.match(card, /item\.categoryLabel/);
  assert.doesNotMatch(card, /category_key|item\.category\b|loadNewsCategories|getNewsCategoryDisplay/);
});

test("repository is the single active sort-order source", () => {
  const source = read("./services/newsCategories.repository.js");
  assert.match(source, /from\("news_categories"\)/);
  assert.match(source, /order\("sort_order", \{ ascending: true \}\)/);
  assert.match(source, /eq\("is_active", true\)/);
});

test("dropdown uses supplied active categories without a hardcoded list", () => {
  const source = read("./forms/NewsCategoryFields.js");
  assert.match(source, /categories\.map/);
  assert.doesNotMatch(source, /NEWS_CATEGORIES|getCategoryKeyFromLabel/);
});

test("news payload writes category key but never the legacy category field", () => {
  const payload = read("./helpers/newsPayload.js");
  const sanitizer = read("./helpers/newsAuthor.core.mjs");
  assert.match(payload, /category_key: form\.category_key/);
  assert.doesNotMatch(payload, /category:\s*form\.category/);
  assert.match(sanitizer, /"category"/);
});

test("admin dashboard and public news routes load the shared categories", () => {
  const sources = ["../dashboard/dashboard.loader.js", "../topbar/adminSearch.service.js", "../../../app/(website)/page.js", "../../../app/(website)/news/page.js", "../../../app/(website)/news/uebersicht/page.js", "../../../app/(website)/news/[slug]/page.js"].map(read).join("\n");
  assert.ok((sources.match(/loadNewsCategories/g) || []).length >= 6);
  assert.match(sources, /category_key/);
});

test("one category query maps each public list and category mutations revalidate news", () => {
  for (const path of ["../../../app/(website)/page.js", "../../../app/(website)/news/page.js", "../../../app/(website)/news/uebersicht/page.js"]) { const source = read(path); assert.equal((source.match(/loadNewsCategories\(/g) || []).length, 1); assert.match(source, /createPublicNewsCardDto/); }
  const actions = read("../../../app/admin/settings/categories/actions.js");
  assert.match(actions, /revalidatePublicContent\("news"\)/);
  assert.doesNotMatch(actions, /unstable_noStore|noStore/);
});
