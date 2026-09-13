import test from "node:test";
import assert from "node:assert/strict";

import { formatPublicPlayerName } from "./publicPlayerName.mjs";

test("formats public player names with only the surname initial", () => {
  assert.equal(formatPublicPlayerName("Boran", "Aktan"), "Boran A.");
  assert.equal(formatPublicPlayerName("Max Paul", "Mustermann"), "Max Paul M.");
  assert.equal(formatPublicPlayerName("Max", "Öztürk"), "Max Ö.");
  assert.equal(formatPublicPlayerName("Max", "Müller-Schmidt"), "Max M.");
});

test("normalizes whitespace and safely handles missing name parts", () => {
  assert.equal(formatPublicPlayerName(" Boran ", " Aktan "), "Boran A.");
  assert.equal(formatPublicPlayerName("Boran", null), "Boran");
  assert.equal(formatPublicPlayerName("Boran", undefined), "Boran");
  assert.equal(formatPublicPlayerName(null, "Aktan"), "A.");
  assert.equal(formatPublicPlayerName(null, null), "");
});
