"use client";

import { Menu } from "lucide-react";
import AdminBrand from "./AdminBrand";
import AdminSearchBar from "./AdminSearchBar";
import AdminNotificationButton from "./AdminNotificationButton";
import AdminProfileMenu from "./AdminProfileMenu";
import AdminTopbarClock from "@/components/admin/topbar/AdminTopbarClock";
import WebsiteButton from "@/components/admin/topbar/WebsiteButton";

export default function AdminHeader({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0f]/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 lg:h-[var(--admin-header-height)] lg:py-0">
        <div className="flex flex-col gap-3 lg:h-full lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center justify-between gap-3 lg:shrink-0">
            <AdminBrand />

            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Navigation öffnen"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 transition hover:border-red-500/60 hover:bg-white/[0.07] hover:text-white lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="lg:min-w-0 lg:flex-1">
            <div className="hidden min-w-0 lg:block">
              <AdminSearchBar />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 lg:shrink-0 lg:gap-3">
            <div className="hidden xl:block">
              <AdminTopbarClock />
            </div>

            <div className="hidden xl:block">
              <WebsiteButton />
            </div>

            <AdminNotificationButton />
            <AdminProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
