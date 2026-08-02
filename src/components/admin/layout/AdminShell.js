"use client";

import { useRef, useState } from "react";
import { AdminUiContextProvider } from "@/components/admin/auth/AdminUiContext";
import AdminHeader from "./AdminHeader";
import AdminContent from "./AdminContent";
import AdminNavigationExperience from "@/components/admin/navigation/AdminNavigationExperience";

export default function AdminShell({
  children,
  title,
  subtitle,
  showHeader = true,
  navigation = null,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const hasNavigation = Boolean(navigation?.sections?.length);

  return (
    <AdminUiContextProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
        <div className="[--admin-header-height:88px] [--admin-navigation-height:56px]">
          <AdminHeader
            menuButtonRef={mobileMenuButtonRef}
            navigationOpen={mobileNavOpen}
            onMenuClick={() => setMobileNavOpen(true)}
            showNavigationButton={hasNavigation}
          />

          {hasNavigation ? (
            <AdminNavigationExperience
              navigation={navigation}
              mobileOpen={mobileNavOpen}
              onMobileOpenChange={setMobileNavOpen}
              mobileOpenerRef={mobileMenuButtonRef}
            />
          ) : null}

          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8">
            <AdminContent className="pt-0 lg:pt-0">
              {showHeader && (title || subtitle) && (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] md:p-8">
                  {subtitle && (
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
                      {subtitle}
                    </p>
                  )}

                  {title && (
                    <h1 className="mt-3 text-3xl font-black md:text-4xl">
                      {title}
                    </h1>
                  )}
                </div>
              )}

              {children}
            </AdminContent>
          </div>
        </div>
      </main>
    </AdminUiContextProvider>
  );
}
