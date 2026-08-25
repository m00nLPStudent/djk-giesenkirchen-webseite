import test from "node:test";
import assert from "node:assert/strict";
import { createMediaStoragePath, getMediaFileSizeError, MEDIA_FILE_LIMITS, normalizeMediaMetadata, validateMediaDescriptor } from "./mediaValidation.core.mjs";

test("accepts only supported signatures with bounded sizes", () => {
  assert.equal(validateMediaDescriptor({ name: "foto.JPG", type: "image/jpeg", size: 10, bytes: [0xff,0xd8,0xff] }).ok, true);
  assert.equal(validateMediaDescriptor({ name: "fake.jpg", type: "image/jpeg", size: 10, bytes: [1,2,3] }).ok, false);
  assert.equal(validateMediaDescriptor({ name: "page.html", type: "text/html", size: 10, bytes: [] }).ok, false);
  assert.equal(validateMediaDescriptor({ name: "big.pdf", type: "application/pdf", size: 21*1024*1024, bytes: [0x25,0x50,0x44,0x46,0x2d] }).ok, false);
});

test("uses the central limits for friendly client and server size errors", () => {
  const jpeg = [0xff, 0xd8, 0xff];
  assert.equal(MEDIA_FILE_LIMITS.image, 10 * 1024 * 1024);
  assert.equal(MEDIA_FILE_LIMITS.document, 20 * 1024 * 1024);
  assert.equal(validateMediaDescriptor({ name: "rand.jpg", type: "image/jpeg", size: MEDIA_FILE_LIMITS.image, bytes: jpeg }).ok, true);
  const oversized = { name: "gross.jpg", type: "image/jpeg", size: MEDIA_FILE_LIMITS.image + 1 };
  assert.equal(getMediaFileSizeError(oversized), "Die ausgewählte Bilddatei ist zu groß. Erlaubt sind maximal 10 MB.");
  assert.equal(validateMediaDescriptor({ ...oversized, bytes: jpeg }).error, getMediaFileSizeError(oversized));
});

test("normalizes metadata and creates opaque structured paths", () => {
  const metadata = normalizeMediaMetadata({ visibility: "invalid", purpose: "player", displayName: "  Bild\u0000 " });
  assert.equal(metadata.visibility, "admin");
  assert.equal(metadata.displayName, "Bild");
  assert.equal(createMediaStoragePath({ purpose: "player", id: "uuid", extension: "jpg", mediaKind: "image" }), "images/player/uuid.jpg");
});

test("team metadata supports both central public and admin uploads", () => {
  assert.deepEqual(
    ["public", "admin"].map((visibility) => normalizeMediaMetadata({ visibility, purpose: "team" })),
    [
      { displayName: null, altText: null, description: null, copyrightNotice: null, sourceLabel: null, visibility: "public", purpose: "team" },
      { displayName: null, altText: null, description: null, copyrightNotice: null, sourceLabel: null, visibility: "admin", purpose: "team" },
    ],
  );
  assert.equal(createMediaStoragePath({ purpose: "team", id: "uuid", extension: "webp", mediaKind: "image" }), "images/team/uuid.webp");
});
