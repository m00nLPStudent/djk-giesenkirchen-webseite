import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const button = read("../delete/AdminRemoveButton.js");
const newsButton = read("../ui/DeleteNewsButton.js");
const actions = read("../../../app/admin/news/actions.js");

test("news delete targets the canonical overview after success", () => {
  assert.match(newsButton, /successHref="\/admin\/news"/);
  assert.match(button, /router\.replace\(successHref\)/);
  const redirectBranch = button.slice(button.indexOf("if (successHref)"), button.indexOf("router.refresh()"));
  assert.doesNotMatch(redirectBranch, /router\.refresh/);
});

test("news delete uses the permission-checked server action and revalidates before returning", () => {
  const newsAction = actions.slice(actions.indexOf("export async function deleteNewsAction"), actions.indexOf("export async function saveNewsWithAuthorAction"));
  assert.match(newsAction, /requiredPermission: "news\.delete"/);
  assert.match(newsAction, /createSupabaseAdminClient\(\)/);
  assert.match(newsAction, /from\("news"\)\.delete\(\)/);
  assert.match(newsAction, /if \(!result\.error\)/);
  assert.match(newsAction, /await revalidatePublicContentAction\("news"\)/);
  assert.ok(newsAction.indexOf("await revalidatePublicContentAction") < newsAction.indexOf("return result"));
});

test("delete errors retain the existing handling and never redirect", () => {
  const errorBranch = button.slice(button.indexOf("if (error)"), button.indexOf("if (result?.message)"));
  assert.match(errorBranch, /alert\("Fehler: " \+ error\.message\)/);
  assert.match(errorBranch, /return/);
  assert.doesNotMatch(errorBranch, /router\.replace/);
});
