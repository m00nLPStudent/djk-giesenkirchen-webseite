import { supabase } from "@/lib/supabase";

function normalizeMessage(message) {
  return (message || "Unbekannter Fehler").toString().trim();
}

export function formatSupabaseError(error, fallback = "Unbekannter Fehler") {
  if (!error) return normalizeMessage(fallback);

  const message = error.message || error.error_description || error.details;
  const code = error.code ? ` (${error.code})` : "";
  return `${normalizeMessage(message)}${code}`;
}

export function isLikelyRlsError(message = "") {
  const text = message.toLowerCase();
  return (
    text.includes("row-level security") ||
    text.includes("permission denied") ||
    text.includes("not allowed")
  );
}

export function toAdminError(scope, error, fallbackText) {
  const message = formatSupabaseError(error, fallbackText);
  return new Error(`[${scope}] ${message}`);
}

export function isBrowserRuntime() {
  return typeof window !== "undefined";
}

export async function assertBrowserSession(scope) {
  if (!isBrowserRuntime()) return;

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw toAdminError(scope, error, "Session konnte nicht gelesen werden.");
  }

  if (!data?.session) {
    throw new Error(`[${scope}] Keine Session gefunden.`);
  }
}

export function buildRlsHint(scope, tables) {
  return new Error(
    `[${scope}] Keine Daten lesbar (${tables.join(", ")}). Moeglich: RLS/fehlende SELECT-Policy fuer authenticated user.`,
  );
}

export function getReadableErrorMessage(error, fallbackText) {
  if (!error) return fallbackText;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || fallbackText;
  return fallbackText;
}

export function logAdminDebugError(scope, error) {
  if (process.env.NODE_ENV !== "development") return;
  const message = getReadableErrorMessage(error, "Unbekannter Fehler");
  console.error(`[admin-debug:${scope}] ${message}`);
}
