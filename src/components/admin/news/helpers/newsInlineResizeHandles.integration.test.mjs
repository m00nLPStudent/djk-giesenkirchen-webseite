import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createTinyMceInit, ADMIN_TINYMCE_CONTENT_STYLE, ADMIN_TINYMCE_PLUGINS } from "../../richtext/adminRichTextEditor.config.js";
import { createCentralMediaImageHtml } from "./newsInlineMedia.core.mjs";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";

const ID = "11111111-1111-4111-8111-111111111111";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const configSource = read("../../richtext/adminRichTextEditor.config.js");

test("final news runtime config enables native proportional image resizing", () => {
  const init = createTinyMceInit({ id: "news-content", onOpenMediaPicker() {} });
  assert.equal(init.object_resizing, "img");
  assert.equal(init.resize_img_proportional, true);
  assert.equal(init.image_dimensions, true);
  assert.ok(ADMIN_TINYMCE_PLUGINS.includes("image"));
});

test("custom iframe content CSS visibly restores TinyMCE resize handles", () => {
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /\.mce-content-body div\.mce-resizehandle/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /width: 10px/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /height: 10px/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /z-index: 1298/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /nwse-resize/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /nesw-resize/);
});

test("central image markup remains editable without noneditable flags", () => {
  const html = createCentralMediaImageHtml({ id: ID, previewUrl: "https://example.test/a.jpg" });
  assert.doesNotMatch(html, /contenteditable|draggable|mceNonEditable|noneditable/i);
  assert.match(html, new RegExp(`data-media-asset-id="${ID}"`));
});

test("ObjectResized removes only full-width standard class", () => {
  assert.match(configSource, /editor\.dom\.removeClass\(event\.target, "news-inline-image--standard"\)/);
  assert.doesNotMatch(configSource, /removeAttribute\([^)]*data-media-asset-id|removeClass\([^)]*flow-|removeClass\([^)]*center|removeClass\([^)]*right/);
});

test("valid resized width survives while height and unsafe width do not", () => {
  const valid = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" data-media-asset-id="${ID}" class="news-inline-image--flow-left" width="480" height="320">`);
  assert.match(valid, /width="480"/);
  assert.match(valid, /class="news-inline-image--flow-left"/);
  assert.match(valid, new RegExp(`data-media-asset-id="${ID}"`));
  assert.doesNotMatch(valid, /height=/);
  assert.doesNotMatch(sanitizeRichTextHtml('<img src="https://example.test/a.jpg" width="9999">'), /width=/);
});
