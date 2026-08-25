import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";
import { createCentralMediaImageHtml, extractNewsInlineMediaAssetIds } from "./newsInlineMedia.core.mjs";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const config = read("../../richtext/adminRichTextEditor.config.js");
const publicCss = read("../../../../app/globals.css");
const publicRenderer = read("../../../website/content/RichTextContent.js");

test("native TinyMCE image controls retain media identity after resizing", () => {
  assert.match(config, /object_resizing: onOpenMediaPicker \? "img"/);
  assert.match(config, /resize_img_proportional: true/);
  assert.match(config, /image_dimensions: Boolean\(onOpenMediaPicker\)/);
  assert.match(config, /image_class_list: onOpenMediaPicker \? NEWS_INLINE_IMAGE_CLASSES/);
  assert.match(config, /ObjectResized/);
  const html = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" data-media-asset-id="${A}" style="width: 480px; height: 320px">`);
  assert.match(html, /width="480"/);
  assert.match(html, new RegExp(`data-media-asset-id="${A}"`));
  assert.doesNotMatch(html, /style=|height=/);
});

test("several images keep independent safe presentations and usages", () => {
  const html = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" data-media-asset-id="${A}" class="news-inline-image--flow-left" width="360"><p>Text</p><img src="https://example.test/b.jpg" data-media-asset-id="${B}" class="news-inline-image--center" width="640">`);
  assert.deepEqual(extractNewsInlineMediaAssetIds(html), [A, B]);
  assert.match(html, /news-inline-image--flow-left/);
  assert.match(html, /news-inline-image--center/);
  assert.match(html, /width="360"/);
  assert.match(html, /width="640"/);
});

test("only explicit image classes and bounded numeric widths survive", () => {
  const safe = sanitizeRichTextHtml('<img src="https://example.test/a.jpg" class="evil news-inline-image--flow-right" width="420" style="position:fixed;left:0">');
  assert.match(safe, /class="news-inline-image--flow-right"/);
  assert.match(safe, /width="420"/);
  assert.doesNotMatch(safe, /evil|position|style=/);
  for (const unsafe of ['width="0"', 'width="9999"', 'width="40%"', 'style="width: expression(alert(1))"', 'height="500"']) {
    const output = sanitizeRichTextHtml(`<img src="https://example.test/a.jpg" ${unsafe}>`);
    assert.doesNotMatch(output, /width=|height=|style=/);
  }
});

test("standard left center right and both flow variants are configured", () => {
  for (const name of ["standard", "left", "center", "right", "flow-left", "flow-right"]) {
    assert.match(config, new RegExp(`news-inline-image--${name}`));
    assert.match(publicCss, new RegExp(`news-inline-image--${name}`));
  }
  assert.match(publicCss, /@media \(max-width: 640px\)[\s\S]*float: none;[\s\S]*width: 100%/);
  assert.match(publicRenderer, /news-richtext-content/);
});

test("new central images start responsive while legacy HTTPS remains compatible", () => {
  const central = createCentralMediaImageHtml({ id: A, previewUrl: "https://example.test/a.jpg", alt_text: "A" });
  assert.match(central, /class="news-inline-image--standard"/);
  assert.match(sanitizeRichTextHtml('<img src="https://legacy.test/image.jpg" class="news-inline-image--right" width="500">'), /https:\/\/legacy\.test\/image\.jpg/);
  assert.equal(sanitizeRichTextHtml('<img src="data:image/png;base64,abc">'), "");
  assert.equal(sanitizeRichTextHtml('<img src="blob:https://example.test/id">'), "");
});
