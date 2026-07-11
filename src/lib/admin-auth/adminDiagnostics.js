import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

let authInitPromise = null;

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

function makeAuthState({
  authInitDone = false,
  hasSession = false,
  hasUser = false,
  session = null,
  user = null,
  errorCode = null,
  message = "",
  error = null,
} = {}) {
  return {
    authInitDone,
    hasSession,
    hasUser,
    session,
    user,
    errorCode,
    message,
    error,
  };
}

export async function waitForBrowserAuthInitialization(scope = "admin-auth") {
  if (!isBrowserRuntime()) {
    return makeAuthState({
      authInitDone: false,
      errorCode: "not-browser-runtime",
      message: "Browser-Kontext fehlt.",
    });
  }

  if (!authInitPromise) {
    authInitPromise = (async () => {
      const supabaseBrowser = getSupabaseBrowserClient();
      if (!supabaseBrowser) {
        return makeAuthState({
          authInitDone: false,
          errorCode: "missing-browser-client",
          message: "Supabase Browser-Client konnte nicht erzeugt werden.",
        });
      }

      const { data, error } = await supabaseBrowser.auth.getSession();
      if (error) {
        return makeAuthState({
          authInitDone: true,
          errorCode: "auth-get-session-failed",
          message: formatSupabaseError(
            error,
            "Session konnte nicht gelesen werden.",
          ),
          error,
        });
      }

      if (data?.session) {
        return makeAuthState({
          authInitDone: true,
          hasSession: true,
          hasUser: Boolean(data.session.user?.id),
          session: data.session,
          user: data.session.user || null,
        });
      }

      const timeoutMs = 1200;
      return await new Promise((resolve) => {
        let resolved = false;
        let subscription = null;

        const finalize = (state) => {
          if (resolved) return;
          resolved = true;
          if (subscription?.unsubscribe) {
            subscription.unsubscribe();
          }
          resolve(state);
        };

        const timer = window.setTimeout(() => {
          finalize(
            makeAuthState({
              authInitDone: true,
              hasSession: false,
              errorCode: "no-browser-session",
              message: "Keine aktive Browser-Session vorhanden.",
            }),
          );
        }, timeoutMs);

        const listener = supabaseBrowser.auth.onAuthStateChange(
          (event, session) => {
            if (
              event !== "INITIAL_SESSION" &&
              event !== "SIGNED_IN" &&
              event !== "SIGNED_OUT"
            ) {
              return;
            }

            window.clearTimeout(timer);
            finalize(
              makeAuthState({
                authInitDone: true,
                hasSession: Boolean(session),
                hasUser: Boolean(session?.user?.id),
                session: session || null,
                user: session?.user || null,
                errorCode: session ? null : "no-browser-session",
                message: session
                  ? ""
                  : "Keine aktive Browser-Session vorhanden.",
              }),
            );
          },
        );

        subscription = listener?.data?.subscription || null;
      });
    })();
  }

  const result = await authInitPromise;
  authInitPromise = null;

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[admin-auth:${scope}] init_done=${result.authInitDone} session=${result.hasSession} user=${result.hasUser} code=${result.errorCode || "none"}`,
    );
    if (result.error) {
      console.info(
        `[admin-auth:${scope}] supabase_error=${formatSupabaseError(result.error, "Unbekannter Fehler")}`,
      );
    }
  }

  return result;
}

export async function getBrowserAuthState(scope = "admin-auth") {
  const initState = await waitForBrowserAuthInitialization(scope);
  if (!initState.authInitDone || !initState.hasSession) {
    return initState;
  }

  const supabaseBrowser = getSupabaseBrowserClient();
  const { data, error } = await supabaseBrowser.auth.getUser();
  if (error) {
    return makeAuthState({
      authInitDone: true,
      hasSession: true,
      hasUser: false,
      session: initState.session,
      errorCode: "auth-get-user-failed",
      message: formatSupabaseError(
        error,
        "Benutzer konnte nicht gelesen werden.",
      ),
      error,
    });
  }

  return makeAuthState({
    authInitDone: true,
    hasSession: true,
    hasUser: Boolean(data?.user?.id),
    session: initState.session,
    user: data?.user || null,
    errorCode: data?.user?.id ? null : "auth-user-missing",
    message: data?.user?.id
      ? ""
      : "Session vorhanden, aber kein Benutzer geladen.",
  });
}

export async function assertBrowserSession(scope) {
  if (!isBrowserRuntime()) return;

  const authState = await getBrowserAuthState(scope);
  if (!authState.hasSession) {
    throw new Error(`[${scope}] Keine Session gefunden.`);
  }
  if (!authState.hasUser) {
    throw new Error(
      `[${scope}] Session vorhanden, aber kein Benutzer gefunden.`,
    );
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
