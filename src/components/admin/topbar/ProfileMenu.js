"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCog, UserCircle } from "lucide-react";
import { AUTH_REQUIRED_FOR_ADMIN } from "@/lib/admin-auth/adminAuthConfig";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import { logAdminDebugError } from "@/lib/admin-auth/adminDiagnostics";
import { adminLogoutAction } from "@/app/admin/logout/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

export default function ProfileMenu() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userState, setUserState] = useState({
    isLoggedIn: false,
    name: "Laedt ...",
    roleLabel: "Laedt ...",
    statusLabel: "",
    email: "",
  });

  useEffect(() => {
    function handleClick(event) {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadAuthContext() {
    setLoadingContext(true);
    setLoadError("");

    try {
      const context = await getCurrentAdminContext();
      if (context?.debugError) {
        logAdminDebugError("profile-menu", context.debugError);
        setLoadError(context.debugError);
        setUserState({
          isLoggedIn: false,
          name: "Authentifizierung",
          roleLabel: "Fehler",
          statusLabel: "Bitte erneut versuchen",
          email: "",
        });
        return;
      }

      if (!context?.user?.id) {
        setUserState({
          isLoggedIn: false,
          name: "Nicht angemeldet",
          roleLabel: "Keine aktive Sitzung",
          statusLabel: "",
          email: "",
        });
        return;
      }

      const hasLoadedRoles = Array.isArray(context?.roles);
      const primaryRoleName = !hasLoadedRoles
        ? "Fehler"
        : context?.primaryRole?.name ||
          context?.roles?.find((role) => role?.is_primary)?.name ||
          context?.roles?.[0]?.name ||
          "Keine Rolle";

      const hasProfile = Boolean(context?.hasAdminProfile);
      const profileActive =
        context?.profile?.is_active ?? context?.profile?.isActive;
      const statusLabel = !hasProfile
        ? "Kein Admin-Profil"
        : profileActive === false
          ? "Inaktiv"
          : "Aktiv";
      const profileName =
        context?.fullName ||
        context?.profile?.full_name ||
        context?.profile?.name ||
        [context?.profile?.first_name, context?.profile?.last_name]
          .filter(Boolean)
          .join(" ") ||
        context?.user?.email ||
        "Admin";

      setUserState({
        isLoggedIn: true,
        name: profileName,
        roleLabel: primaryRoleName,
        statusLabel,
        email: context?.user?.email || "",
      });
    } catch (error) {
      logAdminDebugError("profile-menu", error);
      setLoadError("Profilstatus konnte nicht geladen werden.");
      setUserState({
        isLoggedIn: false,
        name: "Authentifizierung",
        roleLabel: "Fehler",
        statusLabel: "Bitte erneut versuchen",
        email: "",
      });
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    loadAuthContext();
  }, []);

  useEffect(() => {
    if (open) {
      loadAuthContext();
    }
  }, [open]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoadError("");
    setLoggingOut(true);

    let clientSignOutSuccess = false;

    try {
      const supabaseBrowser = getSupabaseBrowserClient();

      if (supabaseBrowser) {
        const { error: localError } = await supabaseBrowser.auth.signOut({
          scope: "local",
        });
        clientSignOutSuccess = !localError;
      } else {
        clientSignOutSuccess = true;
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[admin-logout]", {
          step: "client-signout",
          success: clientSignOutSuccess,
        });
      }

      const logoutResult = await adminLogoutAction();
      const loginTarget = AUTH_REQUIRED_FOR_ADMIN ? "/admin/login" : "/admin";

      if (process.env.NODE_ENV === "development") {
        console.info("[admin-logout]", {
          step: "server-logout",
          success: Boolean(logoutResult?.ok),
          reason: logoutResult?.reason || null,
        });
        console.info("[admin-logout]", {
          step: "redirect-started",
          destination: loginTarget,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.info("[admin-logout]", {
          step: "server-logout-error",
          clientSignOutSuccess,
          message: error?.message || String(error),
        });
      }
    } finally {
      const loginTarget = AUTH_REQUIRED_FOR_ADMIN ? "/admin/login" : "/admin";
      if (process.env.NODE_ENV === "development") {
        console.info("[admin-logout]", {
          step: "redirect-started",
          destination: loginTarget,
        });
      }
      setOpen(false);
      window.location.replace(loginTarget);
    }
  }

  function handleGoToLogin() {
    setOpen(false);
    window.location.assign("/admin/login");
  }

  function handleGoToProfile() {
    setOpen(false);
    window.location.assign("/admin/profile");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-left transition hover:border-red-500/70 hover:bg-white/[0.07]"
      >
        <UserCircle size={27} className="text-white/75" />
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-black text-white">{userState.name}</p>
          <p className="text-xs text-white/40">
            {loadingContext
              ? "Laedt ..."
              : userState.statusLabel
                ? `${userState.roleLabel} · ${userState.statusLabel}`
                : userState.roleLabel}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-white/45 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#18181d] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-black">{userState.name}</p>
            <p className="mt-1 text-xs text-white/45">
              {userState.email || "-"}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {loadingContext
                ? "Laedt ..."
                : userState.statusLabel
                  ? `${userState.roleLabel} · ${userState.statusLabel}`
                  : userState.roleLabel}
            </p>
            {loadError && (
              <p className="mt-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {loadError}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!userState.isLoggedIn}
            onClick={handleGoToProfile}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-bold text-white/75 transition hover:bg-white/5 hover:text-white"
          >
            <UserCog size={18} />
            Profil anpassen
          </button>

          {userState.isLoggedIn ? (
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-left text-sm font-bold text-red-300 transition hover:bg-red-600/10 hover:text-red-200 disabled:opacity-60"
            >
              <LogOut size={18} />
              {loggingOut ? "Wird abgemeldet ..." : "Ausloggen"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToLogin}
              className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-left text-sm font-bold text-red-300 transition hover:bg-red-600/10 hover:text-red-200"
            >
              <LogOut size={18} />
              Anmelden
            </button>
          )}

          {!userState.isLoggedIn && loadError && (
            <button
              type="button"
              onClick={loadAuthContext}
              className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-left text-sm font-bold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Erneut versuchen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
