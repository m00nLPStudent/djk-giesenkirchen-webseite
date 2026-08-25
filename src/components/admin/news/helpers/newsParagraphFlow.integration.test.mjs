import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { applyNewsInlineImageClass, createTinyMceInit } from "../../richtext/adminRichTextEditor.config.js";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";

const ID = "11111111-1111-4111-8111-111111111111";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const config = read("../../richtext/adminRichTextEditor.config.js");
const publicCss = read("../../../../app/globals.css");
const initialState = read("./newsInitialState.js");

function preFixture(flowClass) {
  const root = {
    children: [],
    insertBefore(node, reference) {
      for (const child of this.children) child.children = child.children?.filter((entry) => entry !== node);
      this.children = this.children.filter((entry) => entry !== node);
      const index = reference ? this.children.indexOf(reference) : this.children.length;
      this.children.splice(index, 0, node);
      node.parentElement = this;
    },
  };
  const image = { nodeName: "IMG", width: "300", src: "https://example.test/a.jpg", alt: "Alt", mediaId: ID };
  const pre = { nodeName: "PRE", parentNode: root, parentElement: root, nextSibling: null, children: [image] };
  image.parentElement = pre;
  root.children = [pre];
  let cursor = null;
  const editor = {
    selection: { getNode: () => image, setCursorLocation: (node) => { cursor = node; } },
    dom: {
      getParent: () => null,
      setAttrib: (node, name, value) => { node[name] = value; },
      isEmpty: (node) => !node.children?.length,
      remove: (node) => { root.children = root.children.filter((entry) => entry !== node); },
      create: (name, _attributes, html) => ({ nodeName: name.toUpperCase(), html }),
      insertAfter(node, reference) { root.children.splice(root.children.indexOf(reference) + 1, 0, node); },
      setHTML(node, html) { node.html = html; },
    },
    undoManager: { transact: (callback) => callback() },
    nodeChanged() {},
    focus() {},
  };
  applyNewsInlineImageClass(editor, flowClass);
  return { root, image, cursor: () => cursor };
}

test("new news and TinyMCE explicitly default to normal paragraphs", () => {
  assert.match(initialState, /content_de: news\?\.content_de \|\| ""/);
  const init = createTinyMceInit({ id: "news", onOpenMediaPicker() {} });
  assert.equal(init.forced_root_block, "p");
  assert.match(init.block_formats, /^Absatz=p;/);
  assert.match(init.block_formats, /Vorformatiert=pre/);
});

for (const [label, className] of [["flow-left", "news-inline-image--flow-left"], ["flow-right", "news-inline-image--flow-right"]]) {
  test(`${label} exits a pre wrapper and creates a following paragraph`, () => {
    const fixture = preFixture(className);
    assert.deepEqual(fixture.root.children.map((node) => node.nodeName), ["IMG", "P"]);
    assert.equal(fixture.image.class, className);
    assert.equal(fixture.image.width, "300");
    assert.equal(fixture.image.mediaId, ID);
    assert.equal(fixture.image.src, "https://example.test/a.jpg");
    assert.equal(fixture.image.alt, "Alt");
    assert.equal(fixture.cursor().nodeName, "P");
  });
}

test("intentional pre remains sanitized separately from normal flow paragraphs", () => {
  const html = sanitizeRichTextHtml('<pre onclick="x">bewusst\nvorformatiert</pre><img src="https://example.test/a.jpg" class="news-inline-image--flow-left"><p>Fließtext</p>');
  assert.match(html, /^<pre>bewusst\nvorformatiert<\/pre><img[^>]*news-inline-image--flow-left[^>]*><p>Fließtext<\/p>$/);
  assert.doesNotMatch(html, /onclick|style=/);
});

test("normal image alignment also leaves a legacy pre wrapper", () => {
  const fixture = preFixture("news-inline-image--center");
  assert.deepEqual(fixture.root.children.map((node) => node.nodeName), ["IMG"]);
  assert.equal(fixture.image.class, "news-inline-image--center");
  assert.equal(fixture.image.width, "300");
  assert.equal(fixture.cursor(), null);
});

test("editor and public keep pre styling separate from image paragraph flow", () => {
  assert.match(config, /pre \{ clear: both;/);
  assert.match(publicCss, /\.news-richtext-content pre \{[\s\S]*clear: both;/);
  assert.match(config, /news-inline-image--flow-left[^}]*float: left/);
  assert.match(publicCss, /news-inline-image--flow-right[^}]*float: right/);
  assert.match(publicCss, /@media \(max-width: 640px\)[\s\S]*float: none/);
});

test("the existing context toolbar resize and multi-image contracts remain wired", () => {
  const init = createTinyMceInit({ id: "news", onOpenMediaPicker() {} });
  assert.match(init.image_toolbar, /newsimageflowleft[\s\S]*newsimageflowright[\s\S]*imageoptions/);
  assert.equal(init.object_resizing, "img");
  assert.equal(init.resize_img_proportional, true);
});
