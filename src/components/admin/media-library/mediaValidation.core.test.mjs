import test from "node:test";
import assert from "node:assert/strict";
import { createMediaStoragePath, normalizeMediaMetadata, validateMediaDescriptor } from "./mediaValidation.core.mjs";

test("accepts only supported signatures with bounded sizes", () => {
  assert.equal(validateMediaDescriptor({ name: "foto.JPG", type: "image/jpeg", size: 10, bytes: [0xff,0xd8,0xff] }).ok, true);
  assert.equal(validateMediaDescriptor({ name: "fake.jpg", type: "image/jpeg", size: 10, bytes: [1,2,3] }).ok, false);
  assert.equal(validateMediaDescriptor({ name: "page.html", type: "text/html", size: 10, bytes: [] }).ok, false);
  assert.equal(validateMediaDescriptor({ name: "big.pdf", type: "application/pdf", size: 21*1024*1024, bytes: [0x25,0x50,0x44,0x46,0x2d] }).ok, false);
});

test("normalizes metadata and creates opaque structured paths", () => {
  const metadata = normalizeMediaMetadata({ visibility: "invalid", purpose: "player", displayName: "  Bild\u0000 " });
  assert.equal(metadata.visibility, "admin");
  assert.equal(metadata.displayName, "Bild");
  assert.equal(createMediaStoragePath({ purpose: "player", id: "uuid", extension: "jpg", mediaKind: "image" }), "images/player/uuid.jpg");
});
