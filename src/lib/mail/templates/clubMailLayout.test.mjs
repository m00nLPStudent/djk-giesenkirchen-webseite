import assert from "node:assert/strict";
import test from "node:test";
import { buildClubMailSiteUrls, CLUB_MAIL_LOGO_ALT, normalizeMailActionUrl, renderClubMailLayout } from "./clubMailLayout.mjs";

test("club mail layout is provider-neutral, responsive and escapes content", () => {
  const html = renderClubMailLayout({
    title: "Hallo <script>",
    paragraphs: ["Text & Inhalt"],
    action: { label: "Sicher öffnen", url: "https://verein.example/admin" },
  });
  assert.match(html, /max-width:640px/);
  assert.match(html, /viewport/);
  assert.match(html, /DJK\/VfL Giesenkirchen 05\/09 e\.V\./);
  assert.match(html, /Hallo &lt;script&gt;/);
  assert.match(html, /Text &amp; Inhalt/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /https:\/\/verein\.example\/admin/);
});

test("mail action URLs allow HTTPS and local development but fail closed otherwise", () => {
  assert.equal(normalizeMailActionUrl("https://verein.example/path"), "https://verein.example/path");
  assert.equal(normalizeMailActionUrl("http://localhost:3000/admin"), "http://localhost:3000/admin");
  for (const value of ["http://verein.example", "javascript:alert(1)", "//evil.example", "https://user:secret@verein.example", "not-a-url"]) {
    assert.equal(normalizeMailActionUrl(value), null);
  }
  const html = renderClubMailLayout({ paragraphs: ["Sicher"], action: { label: "Nicht öffnen", url: "https://user:secret@evil.example" } });
  assert.doesNotMatch(html, /evil\.example|Nicht öffnen|secret/);
});

test("logo and legal links derive only from a validated site base URL", () => {
  assert.deepEqual(buildClubMailSiteUrls("https://verein.example"), {
    logoUrl: "https://verein.example/images/club-logo.png",
    imprintUrl: "https://verein.example/impressum",
    privacyUrl: "https://verein.example/datenschutz",
  });
  assert.equal(buildClubMailSiteUrls("http://localhost:3000").logoUrl, "http://localhost:3000/images/club-logo.png");
  for (const value of ["http://verein.example", "https://user:secret@verein.example", "https://verein.example/path", "//evil.example"]) {
    assert.deepEqual(buildClubMailSiteUrls(value), { logoUrl: null, imprintUrl: null, privacyUrl: null });
  }
});

test("layout includes logo alt and legal links or remains intact without a safe base", () => {
  const withSite = renderClubMailLayout({ title: "Test", paragraphs: ["Inhalt"], siteUrl: "https://verein.example" });
  assert.match(withSite, new RegExp(CLUB_MAIL_LOGO_ALT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(withSite, /width="88" height="88"/);
  assert.match(withSite, /https:\/\/verein\.example\/impressum/);
  assert.match(withSite, /https:\/\/verein\.example\/datenschutz/);
  const withoutSite = renderClubMailLayout({ title: "Test", paragraphs: ["Inhalt"], siteUrl: "javascript:alert(1)" });
  assert.doesNotMatch(withoutSite, /<img|Impressum|Datenschutz|javascript:/);
  assert.match(withoutSite, /DJK\/VfL Giesenkirchen/);
});
