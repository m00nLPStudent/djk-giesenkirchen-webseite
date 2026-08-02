import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("./", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("design system exports the shared module primitives", async () => {
  const source = await read("index.js");
  for (const moduleName of ["AdminDetail", "AdminFeedback", "AdminFilters", "AdminList", "AdminModule", "AdminStatus", "tokens"]) {
    assert.ok(source.includes(`./${moduleName}`));
  }
});

test("filter shell is collapsed by default and accessible", async () => {
  const source = await read("AdminFilters.js");
  assert.match(source, /defaultExpanded = false/);
  assert.match(source, /aria-expanded=\{expanded\}/);
  assert.match(source, /aria-controls=\{panelId\}/);
});

test("list system defines desktop, mobile and pagination primitives", async () => {
  const source = await read("AdminList.js");
  assert.match(source, /function AdminModuleList/);
  assert.match(source, /function AdminModuleCards/);
  assert.match(source, /hidden overflow-hidden lg:block/);
  assert.match(source, /function AdminModulePagination/);
});

test("detail system includes shared header, rows, timeline and danger zone", async () => {
  const source = await read("AdminDetail.js");
  for (const name of ["AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminTimeline", "AdminMetaList", "AdminDangerZone"]) {
    assert.ok(source.includes(`function ${name}`));
  }
});

test("legacy-compatible header and badges delegate to the design system", async () => {
  const [header, badge] = await Promise.all([
    read("../layout/AdminPageHeader.js"),
    read("../ui/EntityBadge.js"),
  ]);
  assert.match(header, /AdminModuleHeader/);
  assert.match(badge, /AdminStatusChip/);
});
