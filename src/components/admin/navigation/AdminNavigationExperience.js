"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { applyActivePathToNavigationDto } from "./adminNavigation.matching";
import AdminHorizontalNavigation from "./AdminHorizontalNavigation";
import AdminMobileNavigationDrawer from "./AdminMobileNavigationDrawer";

export default function AdminNavigationExperience({
  navigation,
  mobileOpen,
  onMobileOpenChange,
  mobileOpenerRef,
}) {
  const pathname = usePathname();
  const activeNavigation = useMemo(
    () => applyActivePathToNavigationDto(navigation, pathname),
    [navigation, pathname],
  );
  if (!activeNavigation.sections.length) return null;
  return (
    <div className="xl:sticky xl:top-[var(--admin-header-height)] xl:z-30 xl:border-b xl:border-white/10 xl:bg-[#0d0d12]/95">
      <AdminHorizontalNavigation navigation={activeNavigation} />
      <AdminMobileNavigationDrawer
        key={pathname}
        navigation={activeNavigation}
        open={mobileOpen}
        onOpenChange={onMobileOpenChange}
        openerRef={mobileOpenerRef}
      />
    </div>
  );
}
