const INVALID_REFRESH_TOKEN_CODES = new Set([
  "refresh_token_not_found",
  "invalid_refresh_token",
]);

const LEGACY_AUTH_COOKIE_NAMES = new Set([
  "sb-access-token",
  "sb-refresh-token",
]);

function normalizeText(value) {
  return (value || "").toString().trim().toLowerCase();
}

export function isInvalidRefreshTokenError(error) {
  if (!error) return false;

  const code = normalizeText(error.code);
  const status = Number(error.status || error.statusCode || 0);
  const message = normalizeText(
    error.message || error.error_description || error.details,
  );

  if (INVALID_REFRESH_TOKEN_CODES.has(code)) {
    return true;
  }

  if (code) {
    return false;
  }

  if (status !== 400) {
    return false;
  }

  if (message.includes("invalid refresh token")) {
    return true;
  }

  if (message.includes("refresh token is not valid")) {
    return true;
  }

  if (message.includes("refresh token not found")) {
    return true;
  }

  return false;
}

export function getSupabaseProjectRef(supabaseUrl = "") {
  try {
    const parsed = new URL(supabaseUrl);
    const [projectRef] = parsed.hostname.split(".");
    return normalizeText(projectRef);
  } catch {
    return "";
  }
}

export function getSupabaseAuthCookieNames(cookies = [], supabaseUrl = "") {
  const projectRef = getSupabaseProjectRef(supabaseUrl);
  const names = new Set();

  for (const cookie of cookies || []) {
    const name = cookie?.name || "";
    if (!name) continue;

    if (LEGACY_AUTH_COOKIE_NAMES.has(name)) {
      names.add(name);
      continue;
    }

    if (!name.startsWith("sb-")) {
      continue;
    }

    if (projectRef) {
      if (name.startsWith(`sb-${projectRef}-`)) {
        names.add(name);
      }
      continue;
    }

    if (name.includes("-auth-token")) {
      names.add(name);
    }
  }

  return Array.from(names);
}

export function expireSupabaseAuthCookies(cookieNames = [], setCookie) {
  if (typeof setCookie !== "function") {
    return;
  }

  cookieNames.forEach((name) => {
    setCookie(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });
}
