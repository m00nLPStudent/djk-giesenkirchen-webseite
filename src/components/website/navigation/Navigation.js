"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  isNavigationItemActive,
  isNavigationPathActive,
  publicNavigationItems,
} from "./navigationConfig";

export default function Navigation() {
  const pathname = usePathname();
  const navigationRef = useRef(null);
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState([]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!navigationRef.current?.contains(event.target)) {
        setOpenDesktopMenu(null);
        setIsMobileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenDesktopMenu(null);
        setIsMobileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleMobileMenu(label) {
    setOpenMobileMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  return (
    <div ref={navigationRef} className="relative">
      <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#15151b]/90 px-2 py-2.5 shadow-lg shadow-black/25 xl:flex">
        {publicNavigationItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isOpen = openDesktopMenu === item.label;
          const isActive = isNavigationItemActive(pathname, item);
          const menuId = `desktop-menu-${item.label.toLowerCase()}`;

          return (
            <div
              key={item.label}
              className="relative flex items-center"
              onMouseEnter={() => hasChildren && setOpenDesktopMenu(item.label)}
              onMouseLeave={() => hasChildren && setOpenDesktopMenu(null)}
              onFocus={() => hasChildren && setOpenDesktopMenu(item.label)}
            >
              <Link
                href={item.href}
                onClick={() => {
                  setOpenDesktopMenu(null);
                  setIsMobileOpen(false);
                }}
                aria-current={isNavigationPathActive(pathname, item.href) ? "page" : undefined}
                className={`rounded-full font-black uppercase tracking-[0.08em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                  item.cta
                    ? "bg-red-600 px-3 py-3 text-[0.85rem] text-white hover:bg-red-700"
                    : isActive
                      ? "bg-red-600/45 px-2.5 py-2.5 text-[0.68rem] text-white ring-1 ring-red-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                      : "px-2.5 py-2.5 text-[0.68rem] text-white/75 hover:bg-red-600/20 hover:text-white focus-visible:bg-red-600/20"
                }`}
              >
                {item.label}
              </Link>

              {hasChildren && (
                <button
                  type="button"
                  aria-label={`${item.label} Untermenü ${isOpen ? "schließen" : "öffnen"}`}
                  aria-expanded={isOpen}
                  aria-controls={menuId}
                  onClick={() => setOpenDesktopMenu(isOpen ? null : item.label)}
                  className="mr-0.5 inline-flex h-9 w-6 items-center justify-center rounded-full text-white/55 transition hover:bg-red-600/20 hover:text-white focus-visible:bg-red-600/20 focus-visible:outline-2 focus-visible:outline-red-600"
                >
                  <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
                </button>
              )}

              {hasChildren && isOpen && (
                <div id={menuId} className="absolute left-0 top-[calc(100%-0.125rem)] z-50 pt-2">
                  <div className="w-72 rounded-2xl border border-white/10 bg-[#15151b]/98 p-2 shadow-2xl shadow-black/50">
                    {item.children.map((child) => {
                      const childActive = isNavigationPathActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpenDesktopMenu(null)}
                          aria-current={childActive ? "page" : undefined}
                          className={`block rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-red-600 ${
                            childActive
                              ? "bg-red-600/45 text-white ring-1 ring-red-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                              : "text-white/75 hover:bg-red-600/20 hover:text-white focus-visible:bg-red-600/20"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-main-navigation"
          aria-label={isMobileOpen ? "Menü schließen" : "Menü öffnen"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white shadow-sm transition hover:border-red-600/50 hover:bg-red-600/20 focus-visible:bg-red-600/20 focus-visible:outline-2 focus-visible:outline-red-600"
        >
          {isMobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        {isMobileOpen && (
          <nav
            id="mobile-main-navigation"
            aria-label="Mobile Hauptnavigation"
            className="absolute right-0 top-full z-50 mt-3 max-h-[calc(100vh-6rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border border-white/10 bg-[#111116]/98 p-3 text-white shadow-2xl shadow-black/60"
          >
            <div className="space-y-1">
              {publicNavigationItems.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const isExpanded = openMobileMenus.includes(item.label);
                const isActive = isNavigationItemActive(pathname, item);
                const menuId = `mobile-menu-${item.label.toLowerCase()}`;

                return (
                  <div key={item.href} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-1">
                    <div className="flex items-center gap-1">
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        aria-current={isNavigationPathActive(pathname, item.href) ? "page" : undefined}
                        className={`min-w-0 flex-1 rounded-xl font-black uppercase tracking-[0.1em] focus-visible:outline-2 focus-visible:outline-red-600 ${
                          item.cta
                            ? "bg-red-600 px-[1.125rem] py-3.5 text-[1rem] text-white"
                            : isActive
                              ? "bg-red-600/45 px-4 py-3 text-sm text-white ring-1 ring-red-600/50 backdrop-blur-sm"
                              : "px-4 py-3 text-sm text-white/80 focus-visible:bg-red-600/20"
                        }`}
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={menuId}
                          aria-label={`${item.label} Untermenü ${isExpanded ? "schließen" : "öffnen"}`}
                          onClick={() => toggleMobileMenu(item.label)}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-red-600/20 hover:text-white focus-visible:bg-red-600/20 focus-visible:outline-2 focus-visible:outline-red-600"
                        >
                          <ChevronDown size={18} className={isExpanded ? "rotate-180" : ""} />
                        </button>
                      )}
                    </div>

                    {hasChildren && isExpanded && (
                      <div id={menuId} className="space-y-1 px-2 pt-1 pb-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            aria-current={isNavigationPathActive(pathname, child.href) ? "page" : undefined}
                            className="block rounded-xl border-l-2 border-red-600/50 px-4 py-2.5 text-sm font-semibold text-white/65 hover:bg-red-600/20 hover:text-white focus-visible:bg-red-600/20 focus-visible:outline-2 focus-visible:outline-red-600"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
