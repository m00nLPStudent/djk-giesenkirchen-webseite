"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminContent from "./AdminContent";

export default function AdminShell({
  children,
  title,
  subtitle,
  showHeader = true,
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%),#101014] text-white">
      <div className="[--admin-header-height:88px]">
        <AdminHeader
          onMenuClick={() => setMobileNavOpen((current) => !current)}
        />

        {mobileNavOpen && (
          <div className="border-b border-white/10 bg-[#101014] px-4 py-4 lg:hidden">
            <AdminSidebar mobile onNavigate={() => setMobileNavOpen(false)} />
          </div>
        )}

        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pt-8">
          <div className="hidden lg:block lg:sticky lg:top-[var(--admin-header-height)] lg:h-[calc(100vh-var(--admin-header-height))] lg:self-start">
            <AdminSidebar />
          </div>

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
  );
}
