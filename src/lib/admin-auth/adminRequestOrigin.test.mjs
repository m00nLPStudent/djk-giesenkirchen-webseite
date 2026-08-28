import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminRequestRedirectUrl,
  resolveAdminRequestOrigin,
} from "./adminRequestOrigin.mjs";

function request(url, headers = {}) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    url,
    nextUrl: { origin: new URL(url).origin },
    headers: { get: (name) => normalized.get(name.toLowerCase()) || null },
  };
}

test("tunnel proxy origin replaces only the internal loopback origin", () => {
  const input = request("http://localhost:3000/admin/auth/callback", {
    host: "example-tunnel.test",
    "x-forwarded-host": "example-tunnel.test",
    "x-forwarded-proto": "https",
  });
  assert.equal(resolveAdminRequestOrigin(input), "https://example-tunnel.test");
  assert.equal(
    buildAdminRequestRedirectUrl(input, "/admin/set-password"),
    "https://example-tunnel.test/admin/set-password",
  );
});

test("direct production HTTPS origin is retained", () => {
  const input = request("https://verein.example/admin/auth/callback");
  assert.equal(
    buildAdminRequestRedirectUrl(input, "/admin/set-password"),
    "https://verein.example/admin/set-password",
  );
});

test("direct localhost HTTP origin is retained", () => {
  const input = request("http://localhost:3000/admin/auth/callback");
  assert.equal(
    buildAdminRequestRedirectUrl(input, "/admin/set-password"),
    "http://localhost:3000/admin/set-password",
  );
});

test("absolute, protocol-relative and malformed next values use the internal fallback", () => {
  const input = request("https://verein.example/admin/auth/callback");
  for (const next of [
    "https://evil.example",
    "//evil.example",
    "not-a-path",
    "/admin/set-password?untrusted=1",
  ]) {
    assert.equal(
      buildAdminRequestRedirectUrl(input, next),
      "https://verein.example/admin/set-password",
    );
  }
});

test("untrusted or malformed forwarded headers cannot replace a public origin", () => {
  const publicInput = request("https://verein.example/admin/auth/callback", {
    host: "verein.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "https",
  });
  assert.equal(resolveAdminRequestOrigin(publicInput), "https://verein.example");

  for (const forwardedHost of ["evil.example,verein.example", "user@evil.example", "evil.example/path"]) {
    const input = request("http://localhost:3000/admin/auth/callback", {
      host: "localhost:3000",
      "x-forwarded-host": forwardedHost,
      "x-forwarded-proto": "https",
    });
    assert.equal(resolveAdminRequestOrigin(input), "http://localhost:3000");
  }
});

test("environment localhost cannot override a valid request origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://localhost:3000";
    const input = request("https://example-tunnel.test/admin/auth/callback");
    assert.equal(resolveAdminRequestOrigin(input), "https://example-tunnel.test");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
