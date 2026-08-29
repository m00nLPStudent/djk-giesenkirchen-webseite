import assert from "node:assert/strict";
import test from "node:test";
import { buildGoogleMapsEmbedUrl, isGoogleMapsEmbedUrl, normalizeGoogleMapsUrl } from "./maps.js";
import { resolveSocialLinks } from "./socialLinks.js";

test("social links include every configured valid platform and omit empty or invalid values", () => {
  assert.deepEqual(resolveSocialLinks({
    facebook: "https://facebook.com/verein",
    instagram: "https://instagram.com/verein",
    youtube: "https://youtube.com/@verein",
    tiktok: "https://tiktok.com/@verein",
    linkedin: "https://linkedin.com/company/verein",
    x: "https://x.com/verein",
    unknown: "https://example.com",
  }), {
    facebook: "https://facebook.com/verein",
    instagram: "https://instagram.com/verein",
    youtube: "https://youtube.com/@verein",
    tiktok: "https://tiktok.com/@verein",
    linkedin: "https://linkedin.com/company/verein",
    x: "https://x.com/verein",
  });
  assert.deepEqual(resolveSocialLinks({ facebook: "", instagram: "javascript:alert(1)", x: "https://user:pass@x.com/verein" }), {});
});

test("official maps embed URL requires a plausible API key and a bounded address query", () => {
  const apiKey = `AIza${"a".repeat(35)}`;
  const embedUrl = buildGoogleMapsEmbedUrl({ apiKey, query: "Verein, Musterstraße 1, 12345 Musterstadt" });
  assert.equal(new URL(embedUrl).origin, "https://www.google.com");
  assert.equal(new URL(embedUrl).pathname, "/maps/embed/v1/place");
  assert.equal(new URL(embedUrl).searchParams.get("q"), "Verein, Musterstraße 1, 12345 Musterstadt");
  assert.equal(buildGoogleMapsEmbedUrl({ apiKey: "invalid", query: "Adresse" }), null);
  assert.equal(buildGoogleMapsEmbedUrl({ apiKey, query: "" }), null);
});

test("maps URL accepts Google HTTPS links and distinguishes official embed paths", () => {
  assert.equal(normalizeGoogleMapsUrl("https://maps.app.goo.gl/example"), "https://maps.app.goo.gl/example");
  assert.equal(normalizeGoogleMapsUrl("http://google.com/maps"), null);
  assert.equal(normalizeGoogleMapsUrl("https://evil.example/maps"), null);
  assert.equal(isGoogleMapsEmbedUrl("https://www.google.com/maps/embed?pb=value"), true);
  assert.equal(isGoogleMapsEmbedUrl("https://www.google.com/maps/place/example"), false);
});
