import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ADMIN_TINYMCE_CONTENT_STYLE, createTinyMceInit } from "./adminRichTextEditor.config.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("content skins with global document selectors are not imported", () => {
  const implementation = read("./AdminTinyMceEditor.js");
  assert.match(implementation, /skins\/ui\/oxide-dark\/skin\.css/);
  assert.doesNotMatch(implementation, /skins\/ui\/oxide-dark\/content\.css/);
  assert.doesNotMatch(implementation, /skins\/content\/dark\/content\.css/);
});

test("editor content styles are scoped to the iframe body class", () => {
  const init = createTinyMceInit({ id: "editor", minHeight: 260, toolbarMode: "full" });
  assert.equal(init.inline, undefined);
  assert.equal(init.content_css, false);
  assert.equal(init.body_class, "admin-richtext-content");
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /^\s*\.admin-richtext-content\s*\{/);
  assert.doesNotMatch(ADMIN_TINYMCE_CONTENT_STYLE, /(^|[}\s])(?:body|html|:root|\*)\s*\{/m);
});

test("integration never mutates global classes styles or variables", () => {
  const sources = [read("./AdminRichTextEditor.js"), read("./AdminTinyMceEditor.js"), read("./adminRichTextEditor.config.js")].join("\n");
  assert.doesNotMatch(sources, /document\.(?:body|documentElement)/);
  assert.doesNotMatch(sources, /classList\.(?:add|remove|toggle)/);
  assert.doesNotMatch(sources, /style\.(?:setProperty|removeProperty)/);
  assert.doesNotMatch(sources, /--(?:background|foreground|surface|color|panel|card|input)/);
});

test("wrapper styling is local and admin panel color classes are untouched", () => {
  const wrapper = read("./AdminRichTextEditor.js");
  assert.match(wrapper, /admin-richtext-editor/);
  assert.match(wrapper, /bg-\[#13131a\]/);
  assert.doesNotMatch(wrapper, /!important|router\.refresh|setTimeout/);
});

test("dynamic mounting remains client-only and instance ids remain unique", () => {
  const wrapper = read("./AdminRichTextEditor.js");
  assert.match(wrapper, /useId\(\)/);
  assert.match(wrapper, /ssr: false/);
  assert.doesNotMatch(wrapper, /document\.|window\./);
});
