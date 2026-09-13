import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_TINYMCE_CONTENT_STYLE, ADMIN_TINYMCE_PLUGINS, ADMIN_TINYMCE_TOOLBARS, createTinyMceInit } from "./adminRichTextEditor.config.js";
import { isEditorValueEmpty, normalizeEditorValue } from "./adminRichTextEditor.helpers.js";
import { decodeRichTextEntities, sanitizeRichTextHtml } from "../../../lib/richtext/sanitize.js";

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
  assert.equal(init.entity_encoding, "raw");
});

test("unicode and legacy editor entities render once without double encoding", () => {
  const expected = "Angaben gemäß § 5 DDG – Mönchengladbach";
  assert.equal(
    sanitizeRichTextHtml("<p>Angaben gem&auml;&szlig; &sect; 5 DDG &ndash; M&ouml;nchengladbach</p>"),
    `<p>${expected}</p>`,
  );
  assert.equal(
    sanitizeRichTextHtml('<p>ä ö ü Ä Ö Ü ß · § 5 DDG · 10 € – Vereinsbeitrag · „DJK/VfL Giesenkirchen 05/09 e.V.“ · Design & Programmierung</p>'),
    '<p>ä ö ü Ä Ö Ü ß · § 5 DDG · 10 € – Vereinsbeitrag · „DJK/VfL Giesenkirchen 05/09 e.V.“ · Design &amp; Programmierung</p>',
  );
  assert.equal(decodeRichTextEntities("&#167; &#x20AC; &unknown;"), "§ € &unknown;");
  assert.equal(
    sanitizeRichTextHtml("<p>&quot;Text&quot; &apos;Text&apos; &amp; &lt; &gt;</p>"),
    `<p>"Text" 'Text' &amp; &lt; &gt;</p>`,
  );
  const stableHtml = "<p>Design &amp; Programmierung – gemäß § 5 DDG</p>";
  assert.equal(sanitizeRichTextHtml(stableHtml), stableHtml);
  assert.equal(sanitizeRichTextHtml(sanitizeRichTextHtml(stableHtml)), stableHtml);
});

test("entity decoding cannot turn escaped markup into executable HTML", () => {
  const safe = sanitizeRichTextHtml("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><img src=x onerror=alert(1)>");
  assert.match(safe, /^<p>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/p>/);
  assert.doesNotMatch(safe, /<script>|onerror/);
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
