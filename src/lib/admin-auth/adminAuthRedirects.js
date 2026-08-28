function trimTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

export function normalizeAdminOrigin(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const isLocalHttp =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !isLocalHttp) return "";
    if (parsed.username || parsed.password) return "";
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) return "";

    return trimTrailingSlash(parsed.origin);
  } catch {
    return "";
  }
}

export function getAdminSiteUrl({ browserOrigin = "" } = {}) {
  const rawBrowserOrigin = String(browserOrigin || "").trim();
  if (rawBrowserOrigin) {
    return normalizeAdminOrigin(rawBrowserOrigin);
  }

  const configured =
    normalizeAdminOrigin(process.env.ADMIN_AUTH_REDIRECT_URL) ||
    normalizeAdminOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (configured) return configured;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "";
}

export function buildAdminRedirectUrl(pathname, options = {}) {
  const base = getAdminSiteUrl(options);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!base) return "";
  return `${base}${path}`;
}

export function buildAdminPasswordCallbackUrl(options = {}) {
  return buildAdminRedirectUrl(
    "/admin/auth/callback?next=%2Fadmin%2Fset-password",
    options,
  );
}

export function normalizeAdminRedirectPath(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (!raw.startsWith("/admin")) return "";
  if (raw.startsWith("//")) return "";

  try {
    const url = new URL(raw, "http://localhost");
    const pathname = `${url.pathname}${url.search}${url.hash}`;
    return pathname.startsWith("/admin") ? pathname : "";
  } catch {
    return raw.startsWith("/admin") ? raw : "";
  }
}

export function buildLoginRedirectTarget(redirectPath = "") {
  const safePath = normalizeAdminRedirectPath(redirectPath);
  if (!safePath) {
    return "/admin";
  }

  const restrictedTargets = new Set([
    "/admin/login",
    "/admin/logout",
    "/admin/unauthorized",
    "/admin/forgot-password",
    "/admin/set-password",
  ]);

  try {
    const parsed = new URL(safePath, "http://localhost");
    if (restrictedTargets.has(parsed.pathname)) {
      return "/admin";
    }
  } catch {
    if (restrictedTargets.has(safePath.split("?")[0].split("#")[0])) {
      return "/admin";
    }
  }

  if (safePath === "/admin/login") {
    return "/admin";
  }

  return safePath;
}
