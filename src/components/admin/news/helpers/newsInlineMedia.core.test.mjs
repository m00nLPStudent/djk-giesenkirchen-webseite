import test from "node:test";
import assert from "node:assert/strict";
import { createCentralMediaImageHtml, extractNewsInlineMediaAssetIds, hasInvalidNewsInlineMediaAssetIds, hasNewTransientImageSources, rewriteCentralMediaImageSources } from "./newsInlineMedia.core.mjs";
import { sanitizeRichTextHtml } from "../../../../lib/richtext/sanitize.js";

const A="11111111-1111-4111-8111-111111111111", B="22222222-2222-4222-8222-222222222222";
test("extracts unique valid central image ids and rejects forged ids",()=>{ assert.deepEqual(extractNewsInlineMediaAssetIds(`<img data-media-asset-id="${A}"><img data-media-asset-id="${B}"><img data-media-asset-id="${A}">`),[A,B]); assert.equal(hasInvalidNewsInlineMediaAssetIds('<img data-media-asset-id="bad">'),true); });
test("central insertion escapes alt text and keeps a stable public URL",()=>{ const html=createCentralMediaImageHtml({id:A,previewUrl:"https://cdn.example/a.jpg",alt_text:'A & "B"'}); assert.match(html,new RegExp(A)); assert.match(html,/A &amp; &quot;B&quot;/); assert.equal(createCentralMediaImageHtml({id:A,previewUrl:"blob:x"}),null); });
test("server canonicalizes tagged sources and blocks only newly introduced transient images",()=>{ assert.equal(rewriteCentralMediaImageSources(`<img src="https://evil/x" data-media-asset-id="${A}">`,new Map([[A,"https://public/a.jpg"]])).includes("https://public/a.jpg"),true); assert.equal(hasNewTransientImageSources('<img src="data:image/png;base64,new">',''),true); assert.equal(hasNewTransientImageSources('<img src="blob:legacy">','<img src="blob:legacy">'),false); });
test("public sanitizer keeps only a valid central media attribute",()=>{ assert.match(sanitizeRichTextHtml(`<img src="https://public/a.jpg" data-media-asset-id="${A}" data-evil="x" onerror="x">`),new RegExp(`data-media-asset-id="${A}"`)); assert.doesNotMatch(sanitizeRichTextHtml('<img src="https://public/a.jpg" data-media-asset-id="bad">'),/data-media-asset-id/); });
