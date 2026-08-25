import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { applyNewsInlineImageClass, createTinyMceInit } from "../../richtext/adminRichTextEditor.config.js";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";

const ID = "11111111-1111-4111-8111-111111111111";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const config = read("../../richtext/adminRichTextEditor.config.js");
const publicCss = read("../../../../app/globals.css");

function flowFixture() {
  const root = {
    children: [],
    insertBefore(node, reference) {
      this.children = this.children.filter((child) => child !== node);
      this.children.splice(this.children.indexOf(reference), 0, node);
      node.parentElement = this;
    },
  };
  const image = { nodeName: "IMG", class: "news-inline-image--standard", width: "300", src: "https://example.test/a.jpg", alt: "Alt", mediaId: ID };
  const paragraph = { nodeName: "P", parentNode: root, parentElement: root, children: [image], hasChildNodes: () => false };
  image.parentElement = paragraph;
  root.children = [paragraph];
  let cursor = null;
  const editor = {
    selection: { getNode: () => image, setCursorLocation: (node) => { cursor = node; } },
    dom: {
      getParent: () => null,
      setAttrib: (node, name, value) => { node[name] = value; },
      create: (name) => ({ nodeName: name.toUpperCase() }),
      insertAfter(node, reference) { root.children.splice(root.children.indexOf(reference) + 1, 0, node); },
      setHTML(node, html) { node.html = html; },
    },
    undoManager: { transact: (callback) => callback() },
    nodeChanged() {},
    focus() {},
  };
  return { editor, image, paragraph, root, cursor: () => cursor };
}

for (const [label, className] of [["flow-left", "news-inline-image--flow-left"], ["flow-right", "news-inline-image--flow-right"]]) {
  test(`${label} unwraps the image before the text paragraph and places the cursor`, () => {
    const fixture = flowFixture();
    assert.equal(applyNewsInlineImageClass(fixture.editor, className), true);
    assert.deepEqual(fixture.root.children, [fixture.image, fixture.paragraph]);
    assert.equal(fixture.cursor(), fixture.paragraph);
    assert.equal(fixture.image.class, className);
    assert.equal(fixture.image.width, "300");
    assert.equal(fixture.image.mediaId, ID);
    assert.equal(fixture.image.src, "https://example.test/a.jpg");
    assert.equal(fixture.image.alt, "Alt");
  });
}

test("flow CSS does not clear its own float while normal images remain clearing blocks", () => {
  for (const css of [config, publicCss]) {
    assert.match(css, /img[^}]*clear:\s*both/s);
    assert.match(css, /news-inline-image--flow-left[^}]*clear:\s*none[^}]*float:\s*left/s);
    assert.match(css, /news-inline-image--flow-right[^}]*clear:\s*none[^}]*float:\s*right/s);
    assert.match(css, /display:\s*flow-root/);
  }
});

test("sanitizer preserves the sibling image and paragraph model without unsafe input", () => {
  const html = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" data-media-asset-id="${ID}" class="news-inline-image--flow-left" width="300"><p onclick="x">Text</p>`);
  assert.match(html, /^<img[^>]*news-inline-image--flow-left[^>]*><p>Text<\/p>$/);
  assert.doesNotMatch(html, /onclick|style=|javascript:|data:|blob:/);
});

test("non-flow actions retain their block model and context toolbar", () => {
  for (const className of ["standard", "left", "center", "right"]) {
    assert.match(config, new RegExp(`news-inline-image--${className}`));
  }
  assert.match(createTinyMceInit({ id: "news", onOpenMediaPicker() {} }).image_toolbar, /newsimageflowleft[\s\S]*imageoptions/);
  assert.match(config, /ObjectResized/);
});
