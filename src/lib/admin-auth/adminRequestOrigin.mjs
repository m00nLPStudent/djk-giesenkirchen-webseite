import { normalizeAdminOrigin } from "./adminAuthRedirects.js";

function getHeader(request, name) {
  return String(request?.headers?.get?.(name) || "").trim();
}

function isLoopbackOrigin(origin) {
  if (!origin) return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function normalizeForwardedHost(value = "") {
  const host = String(value || "").trim().toLowerCase();
  if (!host || /[,/\\@\s]/.test(host)) return "";

  const origin = normalizeAdminOrigin(`https://${host}`);
  if (!origin) return "";

  try {
    return new URL(origin).host.toLowerCase() === host ? origin : "";
  } catch {
    return "";
  }
}

export function resolveAdminRequestOrigin(request) {
  const directCandidate = request?.nextUrl?.origin || (() => {
    try {
      return new URL(request?.url || "").origin;
    } catch {
      return "";
    }
  })();
  const directOrigin = normalizeAdminOrigin(directCandidate);

  if (directOrigin && !isLoopbackOrigin(directOrigin)) {
    return directOrigin;
  }

  const forwardedProto = getHeader(request, "x-forwarded-proto").toLowerCase();
  const forwardedHost = getHeader(request, "x-forwarded-host");
  const hostHeader = getHeader(request, "host");

  if (directOrigin && isLoopbackOrigin(directOrigin) && forwardedProto === "https") {
    const forwardedOrigin = normalizeForwardedHost(forwardedHost || hostHeader);
    const hostOrigin = normalizeForwardedHost(hostHeader);
    const hostIsLoopback = isLoopbackOrigin(
      normalizeAdminOrigin(`http://${hostHeader}`),
    );

    if (
      forwardedOrigin &&
      (!hostOrigin || hostIsLoopback || hostOrigin === forwardedOrigin)
    ) {
      return forwardedOrigin;
    }
  }

  return directOrigin;
}

export function buildAdminRequestRedirectUrl(request, pathname) {
  const origin = resolveAdminRequestOrigin(request);
  if (!origin) return "";

  const safePath = pathname === "/admin/set-password"
    ? pathname
    : "/admin/set-password";
  return `${origin}${safePath}`;
}
