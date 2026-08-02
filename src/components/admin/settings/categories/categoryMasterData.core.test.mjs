import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORY_GROUPS, categorySummary, filterCategories, normalizeCategoryPayload } from "./categoryMasterData.core.js";

test("three fixed master-data groups map to the new tables", () => {
  assert.deepEqual(Object.values(CATEGORY_GROUPS).map((item) => item.table), ["news_categories", "event_types", "download_categories"]);
});

test("payload contains only the shared editable columns", () => {
  assert.deepEqual(normalizeCategoryPayload({ name_de: " Test ", name_en: "", slug: " TEST-Key ", is_active: false, sort_order: "4", ignored: true }), { name_de: "Test", name_en: null, slug: "test-key", is_active: false, sort_order: 4 });
});

test("summary and status filter are deterministic", () => {
  const items = [{ id: 1, is_active: false, sort_order: 2 }, { id: 2, is_active: true, sort_order: 1 }];
  assert.deepEqual(categorySummary(items), { total: 2, active: 1, inactive: 1 });
  assert.deepEqual(filterCategories(items, "active").map((item) => item.id), [2]);
});
