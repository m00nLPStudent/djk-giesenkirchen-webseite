"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCog, UserCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AUTH_REQUIRED_FOR_ADMIN } from "@/lib/admin-auth/adminAuthConfig";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";

export default function ProfileMenu() {
  const router = useRouter();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userState, setUserState] = useState({
    isLoggedIn: false,
    name: "Admin",
    roleLabel: "Nicht angemeldet",
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

  useEffect(() => {
    async function loadAuthContext() {
      const context = await getCurrentAdminContext();
      const firstRole = context?.roles?.[0]?.name;
      const profileName =
        context?.profile?.name ||
        [context?.profile?.first_name, context?.profile?.last_name]
          .filter(Boolean)
          .join(" ") ||
        context?.user?.email ||
        "Admin";

      setUserState({
        isLoggedIn: Boolean(context?.user?.id),
        name: profileName,
        roleLabel: firstRole || (context?.isActive ? "Administrator" : "Inaktiv"),
        email: context?.user?.email || "",
      });
    }

    loadAuthContext();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setOpen(false);
    setLoggingOut(false);

    router.push(AUTH_REQUIRED_FOR_ADMIN ? "/admin/login" : "/admin");
    router.refresh();
  }

  function handleGoToLogin() {
    setOpen(false);
    router.push("/admin/login");
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
          <p className="text-xs text-white/40">{userState.roleLabel}</p>
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
              {userState.email || userState.roleLabel}
            </p>
          </div>

          <button
            type="button"
            disabled={!userState.isLoggedIn}
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
              {loggingOut ? "Ausloggen..." : "Ausloggen"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToLogin}
              className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-left text-sm font-bold text-red-300 transition hover:bg-red-600/10 hover:text-red-200"
            >
              <LogOut size={18} />
              Zum Login
            </button>
          )}
        </div>
      )}
    </div>
  );
}
