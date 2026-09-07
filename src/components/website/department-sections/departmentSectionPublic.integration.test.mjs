import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");
const page = read("src/app/(website)/behindertensport/page.js");
const repository = read("src/components/website/department-sections/departmentSectionPublic.repository.js");
const layout = read("src/components/website/department-sections/PublicDepartmentSectionPage.js");

test("Behindertensport route uses the fixed server-side public section contract", () => {
  assert.match(page, /DEPARTMENT_SLUG = "behindertensport"/);
  assert.match(page, /loadPublicDepartmentSection\(DEPARTMENT_SLUG\)/);
  assert.match(page, /await connection\(\)/);
  assert.match(page, /notFound\(\)/);
  assert.doesNotMatch(page, /PublicSectionPlaceholder/);
});

test("repository uses sanitized RPC, RLS training read and public media resolver", () => {
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /\.rpc\("get_public_department_section"/);
  assert.match(repository, /\.from\("department_training_times"\)/);
  assert.match(repository, /loadPublicMediaUrlMap/);
  assert.doesNotMatch(repository, /createSupabaseAdminClient|contact_name.*select|from\("department_sections"\)/s);
});

test("public layout provides image fallback, contact privacy empty state and training empty state", () => {
  assert.match(layout, /DEPARTMENT_SECTION_PLACEHOLDER/);
  assert.match(layout, /contact\.public/);
  assert.match(layout, /kein Ansprechpartner hinterlegt/);
  assert.match(layout, /keine Trainingszeiten veröffentlicht/);
  assert.match(layout, /md:grid-cols-2/);
  assert.match(layout, /items-stretch/);
  assert.equal((layout.match(/className="h-full min-w-0"/g) || []).length, 2);
  assert.match(layout, /break-all/);
});

test("neutral public layout follows title, information, image and description DOM order", () => {
  const title = layout.indexOf("<PublicPageHero");
  const information = layout.indexOf('data-section-layout="contact-training"');
  const contact = layout.indexOf("<ContactCard", information);
  const training = layout.indexOf("<TrainingCard", information);
  const image = layout.indexOf('data-section-layout="image"');
  const description = layout.indexOf('data-section-layout="description"');

  assert.ok(title < information);
  assert.ok(information < contact && contact < training);
  assert.ok(training < image && image < description);
  assert.match(layout, /data\.section\.description \? \(/);
  assert.match(layout, />Über uns<\/h2>/);
  assert.doesNotMatch(layout, /PublicPageHero[^\n]+description=/);
});

test("shared layout stays department-neutral and protects narrow viewports", () => {
  assert.doesNotMatch(layout, /behindertensport|damen-gymnastik/i);
  assert.match(layout, /grid items-stretch gap-6 md:grid-cols-2/);
  assert.match(layout, /min-w-0/);
  assert.match(layout, /break-words/);
});

test("page metadata is bounded and never includes contact fields", () => {
  assert.match(page, /export const metadata/);
  assert.doesNotMatch(page, /contact_email|contact_phone|contact_name/);
});
