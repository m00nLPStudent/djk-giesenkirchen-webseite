import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { applyNewsInlineImageClass, createTinyMceInit } from "../../richtext/adminRichTextEditor.config.js";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";

const ID = "11111111-1111-4111-8111-111111111111";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const config = read("../../richtext/adminRichTextEditor.config.js");
const publicCss = read("../../../../app/globals.css");

function editorFor(image) {
  image.nextElementSibling ||= { nodeName: "P", hasChildNodes: () => true };
  return {
    selection: { getNode: () => image, setCursorLocation() {} },
    dom: {
      getParent: () => null,
      setAttrib: (node, name, value) => { node[name] = value; },
      setHTML() {},
    },
    undoManager: { transact: (callback) => callback() },
    nodeChanged() {},
    focus() {},
  };
}

test("native image context toolbar exposes all six presentation actions", () => {
  const init = createTinyMceInit({ id: "news", onOpenMediaPicker() {} });
  for (const action of ["newsimagestandard", "newsimageleft", "newsimagecenter", "newsimageright", "newsimageflowleft", "newsimageflowright"]) {
    assert.match(init.image_toolbar, new RegExp(`\\b${action}\\b`));
    assert.match(config, new RegExp(`addToggleButton\\(action\\.name`));
  }
  assert.match(init.image_toolbar, /imageoptions/);
});

test("alignment switch is exclusive and preserves image data", () => {
  const image = { nodeName: "IMG", class: "news-inline-image--center news-inline-image--flow-left", width: "300", src: "https://example.test/a.jpg", alt: "Alt", mediaId: ID };
  assert.equal(applyNewsInlineImageClass(editorFor(image), "news-inline-image--flow-right"), true);
  assert.equal(image.class, "news-inline-image--flow-right");
  assert.equal(image.width, "300");
  assert.equal(image.src, "https://example.test/a.jpg");
  assert.equal(image.alt, "Alt");
  assert.equal(image.mediaId, ID);
});

test("standard changes position without resetting a resized width", () => {
  const image = { nodeName: "IMG", class: "news-inline-image--flow-left", width: "300" };
  applyNewsInlineImageClass(editorFor(image), "news-inline-image--standard");
  assert.equal(image.class, "news-inline-image--standard");
  assert.equal(image.width, "300");
  assert.doesNotMatch(config, /news-inline-image--standard[^}]*width:\s*100%/);
});

test("sanitizer keeps one known class and rejects free presentation styles", () => {
  const html = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" data-media-asset-id="${ID}" class="evil news-inline-image--flow-left news-inline-image--right" width="300" style="float:right;margin:0">`);
  assert.match(html, /class="news-inline-image--flow-left"/);
  assert.doesNotMatch(html, /evil|news-inline-image--right|style=|float|margin/);
  assert.match(html, /width="300"/);
  assert.match(html, new RegExp(`data-media-asset-id="${ID}"`));
});

test("editor and public CSS share block alignment float flow and containment", () => {
  for (const css of [config, publicCss]) {
    assert.match(css, /news-inline-image--left/);
    assert.match(css, /news-inline-image--center/);
    assert.match(css, /news-inline-image--right/);
    assert.match(css, /news-inline-image--flow-left[^}]*float:\s*left/s);
    assert.match(css, /news-inline-image--flow-right[^}]*float:\s*right/s);
    assert.match(css, /display:\s*flow-root/);
    assert.match(css, /clear:\s*both/);
  }
  assert.match(publicCss, /@media \(max-width: 640px\)[\s\S]*float: none;[\s\S]*width: 100%/);
});

test("legacy HTTPS images can receive presentation without media usage identity", () => {
  const legacy = { nodeName: "IMG", src: "https://legacy.test/a.jpg", width: "280" };
  assert.equal(applyNewsInlineImageClass(editorFor(legacy), "news-inline-image--right"), true);
  assert.equal(legacy.class, "news-inline-image--right");
  assert.equal(legacy.src, "https://legacy.test/a.jpg");
  assert.equal(legacy.width, "280");
  assert.equal("mediaId" in legacy, false);
});
