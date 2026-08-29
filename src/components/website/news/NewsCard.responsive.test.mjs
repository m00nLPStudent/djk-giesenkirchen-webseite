import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./NewsCard.js", import.meta.url), "utf8");
const home = readFileSync(new URL("../../../app/(website)/page.js", import.meta.url), "utf8");
const events = readFileSync(new URL("../events/HomeEventsSection.js", import.meta.url), "utf8");

test("featured news image and content are compact on phones and restore desktop sizing", () => {
  assert.match(source, /h-40 sm:h-52 md:h-80 lg:h-full/);
  assert.match(source, /p-4 sm:p-6 md:p-9/);
  assert.match(source, /object-cover/);
  assert.match(source, /overflow-hidden/);
});

test("homepage mobile grid has a shrinkable single column before the desktop sidebar", () => {
  assert.match(home, /grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(home, /lg:grid-cols-\[minmax\(0,1fr\)_24rem\]/);
  assert.match(home, /<NewsCard[\s\S]*<HomeEventsSection/);
  assert.match(source, /block h-full min-w-0 w-full max-w-full/);
  assert.match(source, /h-full min-w-0 w-full max-w-full overflow-hidden/);
  assert.match(events, /min-w-0 w-full/);
  assert.match(events, /flex min-w-0 flex-wrap/);
});

test("mobile badge remains in normal flow and every card child can shrink", () => {
  assert.match(source, /justify-start[\s\S]*sm:justify-end/);
  assert.match(source, /max-w-full break-words rounded-full/);
  assert.doesNotMatch(source, /absolute[^\n]*categoryLabel/);
  assert.match(source, /flex h-full min-w-0 flex-col/);
});

test("featured typography and badge retain responsive desktop variants", () => {
  assert.match(source, /mt-4 text-2xl sm:mt-6 sm:text-4xl md:mt-7 md:text-5xl/);
  assert.match(source, /px-3 py-1\.5 text-\[0\.65rem\][\s\S]*sm:px-4 sm:py-2 sm:text-xs/);
  assert.match(source, /line-clamp-3[\s\S]*sm:line-clamp-none/);
  assert.match(source, /flex flex-wrap items-end justify-between/);
  assert.match(source, /break-words/);
});
