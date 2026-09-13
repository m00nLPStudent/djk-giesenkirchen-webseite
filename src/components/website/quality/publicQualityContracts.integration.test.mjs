import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public layout exposes a keyboard skip link and the shared page shell owns its target", async () => {
  const [layout, shell, css] = await Promise.all([
    read("../../../app/(website)/layout.js"),
    read("../layout/PublicPageShell.js"),
    read("../../../app/globals.css"),
  ]);
  assert.match(layout, /href="#main-content"/);
  assert.match(shell, /id="main-content"/);
  assert.match(shell, /tabIndex=\{-1\}/);
  assert.match(css, /\.public-skip-link:focus/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("SEO endpoints are environment-controlled and admin/auth remain noindex", async () => {
  const [root, admin, confirmation, robots, sitemap] = await Promise.all([
    read("../../../app/layout.js"),
    read("../../../app/admin/layout.js"),
    read("../../../app/auth/confirm-email-change/page.js"),
    read("../../../app/robots.js"),
    read("../../../app/sitemap.js"),
  ]);
  assert.match(root, /resolvePublicSeoConfig/);
  assert.match(root, /template: "%s \| DJK\/VfL Giesenkirchen"/);
  assert.match(root, /openGraph/);
  assert.match(root, /twitter/);
  assert.match(root, /PUBLIC_SITE_LOGO_URL/);
  assert.match(admin, /index: false, follow: false/);
  assert.match(confirmation, /index: false, follow: false/);
  assert.match(robots, /buildPublicRobots/);
  assert.match(sitemap, /buildPublicSitemap/);
});
