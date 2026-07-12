function trimTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

function normalizeUrlCandidate(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimTrailingSlash(trimmed);
  }

  return "";
}

export function getAdminSiteUrl({ browserOrigin = "" } = {}) {
  const configured =
    normalizeUrlCandidate(process.env.ADMIN_AUTH_REDIRECT_URL) ||
    normalizeUrlCandidate(process.env.NEXT_PUBLIC_SITE_URL);

  if (configured) return configured;

  const browser = normalizeUrlCandidate(browserOrigin);
  if (browser) return browser;

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
