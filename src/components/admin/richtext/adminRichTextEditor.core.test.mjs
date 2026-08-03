import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_TINYMCE_CONTENT_STYLE, ADMIN_TINYMCE_PLUGINS, ADMIN_TINYMCE_TOOLBARS, createTinyMceInit } from "./adminRichTextEditor.config.js";
import { isEditorValueEmpty, normalizeEditorValue } from "./adminRichTextEditor.helpers.js";
import { sanitizeRichTextHtml } from "../../../lib/richtext/sanitize.js";

test("one central configuration contains only available core plugins", () => {
  for (const plugin of ["advlist", "autolink", "charmap", "code", "fullscreen", "help", "image", "link", "lists", "searchreplace", "table", "visualblocks", "wordcount"]) {
    assert.ok(ADMIN_TINYMCE_PLUGINS.includes(plugin));
  }
  assert.equal(new Set(ADMIN_TINYMCE_PLUGINS).size, ADMIN_TINYMCE_PLUGINS.length);
  assert.doesNotMatch(ADMIN_TINYMCE_PLUGINS.join(" "), /powerpaste|a11ychecker|tinycomments/);
});

test("toolbar centrally exposes the required formatting controls", () => {
  const toolbar = ADMIN_TINYMCE_TOOLBARS.full;
  for (const control of ["undo", "redo", "blocks", "bold", "italic", "underline", "strikethrough", "forecolor", "backcolor", "bullist", "numlist", "outdent", "indent", "blockquote", "link", "table", "hr", "charmap", "removeformat", "searchreplace", "code", "fullscreen", "help"]) {
    assert.match(toolbar, new RegExp(`\\b${control}\\b`));
  }
});

test("configuration is responsive, local and accessible", () => {
  const init = createTinyMceInit({ id: "content", minHeight: 240, placeholder: "Text", toolbarMode: "compact", required: true, ariaDescribedBy: "content-help" });
  assert.equal(init.skin, false);
  assert.equal(init.content_css, false);
  assert.equal(init.toolbar_mode, "wrap");
  assert.equal(init.min_height, 240);
  assert.match(init.iframe_aria_text, /Pflichtfeld/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /img \{ max-width: 100%/);
  assert.match(ADMIN_TINYMCE_CONTENT_STYLE, /table \{/);
});

test("controlled HTML passes through without a format migration", () => {
  const html = '<h2 class="legacy">Titel</h2><p>Text</p>';
  assert.equal(normalizeEditorValue(html), html);
  assert.equal(normalizeEditorValue(null), "");
  assert.equal(isEditorValueEmpty("<p>&nbsp;</p>"), true);
  assert.equal(isEditorValueEmpty("<p>Inhalt</p>"), false);
});

test("central output sanitizer keeps supported content and removes executable HTML", () => {
  const safe = sanitizeRichTextHtml('<table onclick="bad()"><tbody><tr><td colspan="2">Text</td></tr></tbody></table><img src="https://example.com/a.jpg" onerror="bad()"><script>alert(1)</script><a href="javascript:bad()">Link</a>');
  assert.match(safe, /<table><tbody><tr><td colspan="2">Text<\/td><\/tr><\/tbody><\/table>/);
  assert.match(safe, /<img src="https:\/\/example\.com\/a\.jpg" alt="">/);
  assert.doesNotMatch(safe, /onclick|onerror|javascript:|<script>/);
});
