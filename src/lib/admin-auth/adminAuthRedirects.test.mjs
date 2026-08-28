import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminPasswordCallbackUrl,
  buildAdminRedirectUrl,
  getAdminSiteUrl,
} from "./adminAuthRedirects.js";

test("browser recovery uses the actual local HTTP origin ahead of configured URLs", () => {
  assert.equal(
    buildAdminPasswordCallbackUrl({ browserOrigin: "http://localhost:3000" }),
    "http://localhost:3000/admin/auth/callback?next=%2Fadmin%2Fset-password",
  );
});

test("browser recovery uses the actual HTTPS tunnel or production origin", () => {
  assert.equal(
    buildAdminPasswordCallbackUrl({ browserOrigin: "https://current.example.test" }),
    "https://current.example.test/admin/auth/callback?next=%2Fadmin%2Fset-password",
  );
});

test("invalid explicit browser origins fail closed without configuration fallback", () => {
  for (const browserOrigin of [
    "javascript:alert(1)",
    "http://public.example.test",
    "https://user:password@example.test",
    "https://example.test/untrusted-path",
    "//example.test",
  ]) {
    assert.equal(getAdminSiteUrl({ browserOrigin }), "");
    assert.equal(buildAdminPasswordCallbackUrl({ browserOrigin }), "");
  }
});

test("server-only auth flows retain a validated configured origin", () => {
  const previousAdminUrl = process.env.ADMIN_AUTH_REDIRECT_URL;
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.ADMIN_AUTH_REDIRECT_URL = "https://auth.example.test";
    process.env.NEXT_PUBLIC_SITE_URL = "https://site.example.test";
    assert.equal(
      buildAdminRedirectUrl("/admin/set-password"),
      "https://auth.example.test/admin/set-password",
    );
  } finally {
    if (previousAdminUrl === undefined) delete process.env.ADMIN_AUTH_REDIRECT_URL;
    else process.env.ADMIN_AUTH_REDIRECT_URL = previousAdminUrl;
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});
