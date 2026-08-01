import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveCoachImageUrl,
  resolvePlayerImageUrl,
} from "./imageUrl.js";

test("resolvePlayerImageUrl prefers canonical image fields", () => {
  assert.equal(
    resolvePlayerImageUrl(
      {
        imageUrl: "https://example.test/player-normalized.png",
        image_url: "https://example.test/player-canonical.png",
        photo_url: "https://example.test/player-legacy.png",
      },
      "fallback.png",
    ),
    "https://example.test/player-normalized.png",
  );
});

test("resolvePlayerImageUrl keeps legacy photo_url temporarily for bestandsdaten", () => {
  assert.equal(
    resolvePlayerImageUrl(
      { photo_url: "https://example.test/player-legacy.png" },
      "fallback.png",
    ),
    "https://example.test/player-legacy.png",
  );
  assert.equal(resolvePlayerImageUrl({}, "fallback.png"), "fallback.png");
});

test("resolveCoachImageUrl prefers canonical image fields", () => {
  assert.equal(
    resolveCoachImageUrl(
      {
        imageUrl: "https://example.test/coach-normalized.png",
        image_url: "https://example.test/coach-canonical.png",
        photo_url: "https://example.test/coach-legacy.png",
      },
      "fallback.png",
    ),
    "https://example.test/coach-normalized.png",
  );
});

test("resolveCoachImageUrl keeps legacy photo_url temporarily for bestandsdaten", () => {
  assert.equal(
    resolveCoachImageUrl(
      { photo_url: "https://example.test/coach-legacy.png" },
      "fallback.png",
    ),
    "https://example.test/coach-legacy.png",
  );
  assert.equal(resolveCoachImageUrl({}, "fallback.png"), "fallback.png");
});
