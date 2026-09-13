import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicRobots, buildPublicSitemap, normalizePublicSiteUrl, resolvePublicSeoConfig } from "./publicSeo.core.mjs";

test("site URL accepts HTTPS and local HTTP but rejects unsafe origins", () => {
  assert.equal(normalizePublicSiteUrl("https://verein.example"), "https://verein.example");
  assert.equal(normalizePublicSiteUrl("http://localhost:3000"), "http://localhost:3000");
  const credentialUrl = new URL("https://verein.example");
  credentialUrl.username = "user";
  credentialUrl.password = "test-password";
  for (const value of ["http://verein.example", credentialUrl.href, "https://verein.example/path", "not-a-url"]) {
    assert.equal(normalizePublicSiteUrl(value), null);
  }
});

test("indexing is explicit and fail-closed for staging, localhost and missing URLs", () => {
  assert.deepEqual(resolvePublicSeoConfig({ NEXT_PUBLIC_SITE_URL: "https://preview.example" }), { siteUrl: "https://preview.example", indexingEnabled: false });
  assert.equal(resolvePublicSeoConfig({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", PUBLIC_SITE_INDEXING_ENABLED: "true" }).indexingEnabled, false);
  assert.deepEqual(buildPublicRobots({ NEXT_PUBLIC_SITE_URL: "https://preview.example" }), { rules: { userAgent: "*", disallow: "/" } });
  assert.deepEqual(buildPublicSitemap({ NEXT_PUBLIC_SITE_URL: "https://preview.example" }), []);
});

test("production robots and sitemap use only the validated canonical origin", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://verein.example", PUBLIC_SITE_INDEXING_ENABLED: "true" };
  const robots = buildPublicRobots(env);
  const sitemap = buildPublicSitemap(env);
  assert.equal(robots.sitemap, "https://verein.example/sitemap.xml");
  assert.deepEqual(robots.rules.disallow, ["/admin/", "/api/", "/auth/"]);
  assert.ok(sitemap.some((entry) => entry.url === "https://verein.example/tischtennis/trainingszeiten"));
  assert.ok(sitemap.every((entry) => !entry.url.includes("/admin")));
});
