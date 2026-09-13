import assert from "node:assert/strict";
import test from "node:test";
import {
  getPublicPageHref,
  normalizePublicPageSlug,
  selectPublicFooterPages,
} from "./publicPages.helpers.js";

const page = (slug, overrides = {}) => ({
  slug,
  title_de: slug,
  is_published: true,
  show_in_footer: true,
  sort_order: 0,
  ...overrides,
});

test("footer pages require both publication and explicit footer visibility", () => {
  const result = selectPublicFooterPages([
    page("visible"),
    page("hidden", { show_in_footer: false }),
    page("draft", { is_published: false }),
  ]);
  assert.deepEqual(result.map(({ slug }) => slug), ["visible"]);
});

test("all safe CMS slugs participate without a legal-page allowlist", () => {
  const result = selectPublicFooterPages([
    page("jugendschutz"),
    page("agb"),
    page("datenschutz"),
    page("impressum"),
  ]);
  assert.deepEqual(result.map(({ slug }) => slug), ["agb", "datenschutz", "impressum", "jugendschutz"]);
  assert.equal(getPublicPageHref(page("nutzungsbedingungen")), "/nutzungsbedingungen");
});

test("footer ordering is deterministic by order, localized title and slug", () => {
  const result = selectPublicFooterPages([
    page("zwei", { title_de: "Zwei", sort_order: 2 }),
    page("alpha-b", { title_de: "Alpha", sort_order: 1 }),
    page("alpha-a", { title_de: "Alpha", sort_order: 1 }),
  ]);
  assert.deepEqual(result.map(({ slug }) => slug), ["alpha-a", "alpha-b", "zwei"]);
});

test("unsafe or external-looking slugs fail closed", () => {
  for (const slug of ["", "//evil.example", "https://evil.example", "../admin", "über-uns"]) {
    assert.equal(normalizePublicPageSlug(slug), null);
  }
  assert.deepEqual(selectPublicFooterPages([page("//evil.example")]), []);
});
