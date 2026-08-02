import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { resolveNewsAuthorName, sanitizeNewsWritePayload } from "./helpers/newsAuthor.core.mjs";
import { resolveMediaFileName } from "./helpers/newsMedia.core.mjs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const action = read("../../../app/admin/news/actions.js");
const status = read("./components/NewsStatusBadge.js");
const initialState = read("./helpers/newsInitialState.js");
const meta = read("./components/NewsMetaPanel.js");
const content = read("./tabs/NewsContentTab.js");
const payloadSource = read("./helpers/newsPayload.js");
const imagePreview = read("../design-system/AdminImagePreview.js");
const documents = read("./components/NewsDocumentsManager.js");

test("news status uses the compact shared chip for every existing state", () => {
  assert.equal((status.match(/compact/g) || []).length, 3);
  for (const label of ["Entwurf", "Geplant", "Veröffentlicht"]) assert.ok(status.includes(label));
});

test("author resolver follows profile name email and neutral fallback order", () => {
  assert.equal(resolveNewsAuthorName({ full_name: "  Mira Muster  ", email: "mira@example.test" }), "Mira Muster");
  assert.equal(resolveNewsAuthorName({ email: "mira@example.test" }), "mira@example.test");
  assert.equal(resolveNewsAuthorName({}), "Unbekannter Autor");
});

test("server write path rejects client author and English field manipulation", () => {
  const safe = sanitizeNewsWritePayload({ title_de: "Titel", author: "Manipuliert", title_en: "Title", teaser_en: "Teaser", content_en: "Content" });
  assert.deepEqual(safe, { title_de: "Titel" });
  assert.match(action, /requiredPermission: newsId \? "news\.edit" : "news\.create"/);
  assert.match(action, /author: existing\.author/);
  assert.match(action, /resolveAuthorName\(db, permissionResult\.profile\)/);
});

test("visible editor and payload omit English fields without clearing stored values", () => {
  for (const source of [initialState, meta, content]) assert.doesNotMatch(source, /title_en|teaser_en|content_en|Englisch/);
  for (const key of ["title_en", "teaser_en", "content_en", "author:"]) assert.doesNotMatch(payloadSource, new RegExp(key));
  for (const key of ["title_de", "teaser_de", "content_de"]) assert.match(payloadSource, new RegExp(`${key}: form\\.${key}`));
});

test("media filename prefers metadata and safely decodes URL path", () => {
  assert.equal(resolveMediaFileName({ file_name: "einladung.docx", file_url: "https://example.test/other.pdf?token=secret" }), "einladung.docx");
  assert.equal(resolveMediaFileName({ file_url: "https://example.test/news/Spielbericht%20D1.pdf?token=secret" }), "Spielbericht D1.pdf");
  assert.equal(resolveMediaFileName({}, "Dokument"), "Dokument");
});

test("image preview supports failure fallback dialog close paths and focus return", () => {
  for (const marker of ["showModal", "onCancel", "event.target === dialogRef.current", "triggerRef.current?.focus", 'document.body.style.overflow = "hidden"', "setFailedSrc(src)"]) assert.ok(imagePreview.includes(marker));
  assert.match(imagePreview, /if \(!src\)/);
});

test("documents expose safe new-tab links and retain existing mutations", () => {
  assert.match(documents, /target="_blank"/);
  assert.match(documents, /rel="noopener noreferrer"/);
  assert.match(documents, /handleDocumentFieldSave/);
  assert.match(documents, /handleDelete/);
  assert.doesNotMatch(documents, /iframe/);
});
