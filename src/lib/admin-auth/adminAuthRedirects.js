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
