import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public component dynamically isolates the client-only TinyMCE bundle", () => {
  const source = read("./AdminRichTextEditor.js");
  assert.match(source, /^"use client"/);
  assert.match(source, /dynamic\(\(\) => import\("\.\/AdminTinyMceEditor"\)/);
  assert.match(source, /ssr: false/);
  assert.doesNotMatch(source, /tinymce\/|@tinymce/);
});

test("only the central implementation imports TinyMCE and has no save or data access", () => {
  const source = read("./AdminTinyMceEditor.js");
  assert.match(source, /@tinymce\/tinymce-react/);
  assert.match(source, /licenseKey="gpl"/);
  assert.match(source, /value=\{normalizeEditorValue\(value\)\}/);
  assert.match(source, /onEditorChange=\{\(html\) => onChange\?\.\(html\)\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /readonly=\{readOnly\}/);
  assert.doesNotMatch(source, /supabase|fetch\(|save|action/i);
});

test("component API exposes labels, help, errors and aria descriptions", () => {
  const source = read("./AdminRichTextEditor.js");
  for (const token of ["props.id", "props.label", "props.required", "props.error", "props.helpText", 'props["aria-describedby"]']) assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /role="alert"/);
  assert.match(source, /focus-within:ring-2/);
});

test("all current rich-text forms import only the shared editor", () => {
  const sources = [read("../news/tabs/NewsContentTab.js"), read("../club-history/forms/ClubHistoryEditorForm.js"), read("../settings/components/PageForm.js")].join("\n");
  assert.equal((sources.match(/AdminRichTextEditor/g) || []).length >= 6, true);
  assert.doesNotMatch(sources, /@tinymce|tiptap/);
});

test("news payload stays unchanged and public output is sanitized", () => {
  const payload = read("../news/helpers/newsPayload.js");
  const publicPage = read("../../../app/(website)/news/[slug]/page.js");
  assert.match(payload, /content_de: form\.content_de/);
  assert.match(publicPage, /RichTextContent/);
  assert.doesNotMatch(publicPage, /dangerouslySetInnerHTML/);
});
