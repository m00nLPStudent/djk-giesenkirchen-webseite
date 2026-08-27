import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [page, component, service, repository, route, mediaService, footer, adminService] = await Promise.all([
  read("../../../app/(website)/downloads/page.js"), read("./DownloadsPublicPage.js"), read("./downloadsPublic.service.js"), read("./downloadsPublic.repository.js"), read("../../../app/(website)/downloads/[id]/file/route.js"), read("../../admin/media-library/media.service.js"), read("../../Footer.js"), read("../../admin/downloads/downloads.service.js"),
]);

test("public page has metadata, grouped compact UI and a friendly empty state", () => {
  assert.match(page, /Downloads \| DJK\/VfL Giesenkirchen/);
  assert.match(page, /await connection\(\)/);
  assert.match(component, /groups\.map/);
  assert.match(component, /divide-y/);
  assert.match(component, /Aktuell stehen keine Downloads zur Verfügung/);
  assert.match(component, /aria-label=.*herunterladen/);
  assert.doesNotMatch(component, /storage_path|storage_bucket|visibility|purpose|service_role/i);
});

test("repository and service are server-only, read-only and fail closed", () => {
  assert.match(repository, /import "server-only"/);
  assert.match(service, /import "server-only"/);
  assert.doesNotMatch(repository, /\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
  for (const marker of ["is_published", "is_active", "isCompletePublicDownload", "media_asset_usages", "entity_type", "field_name"]) assert.match(repository + service, new RegExp(marker));
  assert.doesNotMatch(service, /getPublicUrl/);
});

test("file route awaits params and redirects only after complete server validation", () => {
  assert.match(route, /const \{ id \} = await params/);
  assert.match(route, /resolvePublicDownloadFile/);
  assert.match(route, /NextResponse\.redirect\(result\.url, 307\)/);
  assert.match(route, /Cache-Control", "private, no-store/);
  assert.match(route, /status: result\.status === "error" \? 500 : 404/);
  assert.doesNotMatch(route, /createSignedUrl|getPublicUrl|SUPABASE|storage_path/);
});

test("signed URL creation is central, private-only, short-lived and never persisted", () => {
  assert.match(service, /createPrivateMediaSignedUrl\(record\.asset\.storage_path, 120\)/);
  assert.match(mediaService, /from\("media-library-private"\)\.createSignedUrl/);
  assert.match(mediaService, /Math\.min\([\s\S]*300/);
  assert.doesNotMatch(mediaService, /signedUrl[\s\S]*\.insert\(|signedUrl[\s\S]*\.update\(/);
});

test("B15.22C admin remains unchanged and the existing footer links downloads once under Verein", () => {
  assert.doesNotMatch(adminService, /loadPublicDownloadGroups|resolvePublicDownloadFile/);
  assert.match(footer, /title: "Verein"[\s\S]*label: "Downloads", href: "\/downloads"/);
  assert.equal((footer.match(/href: "\/downloads"/g) || []).length, 1);
  assert.doesNotMatch(footer, /https?:\/\/[^"']*downloads|target=["']_blank/);
});
