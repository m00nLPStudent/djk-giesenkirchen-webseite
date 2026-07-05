"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import NavigationItem from "./NavigationItem";
import DropdownMenu from "./DropdownMenu";
import { footballMenuItems } from "./footballMenu";

const newsMenuItems = [
  { label: "Aktuelle Meldungen", href: "/news" },
  { label: "News Übersicht", href: "/news/uebersicht" },
];

const termineMenuItems = [
  { label: "Übersicht", href: "/termine" },
  { label: "Trainingstermine", href: "/termine/training" },
  { label: "Allgemeine Termine", href: "/termine/allgemein" },
];

const vereinMenuItems = [
  { label: "Tischtennis", href: "/tischtennis" },
  { label: "Damen-Gymnastik", href: "/damen-gymnastik" },
];

const navigationItems = [
  {
    label: "Startseite",
    href: "/",
  },
  {
    label: "Verein",
    href: "/verein",
    children: vereinMenuItems,
  },
  {
    label: "Fußball",
    href: "/fussball",
    children: footballMenuItems,
  },
  {
    label: "News",
    href: "/news",
    children: newsMenuItems,
  },
  { label: "Termine", href: "/termine", children: termineMenuItems },
  {
    label: "Mitglied werden",
    href: "/mitglied-werden",
    cta: true,
  },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Navigation() {
  const [openMenu, setOpenMenu] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  return (
    <div className="relative">
      <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-1 text-[0.72rem] font-black uppercase tracking-[0.1em] text-white/75 md:flex">
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.label}
            item={{
              ...item,
              dropdown: item.children ? (
                <DropdownMenu items={item.children} />
              ) : null,
            }}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
          />
        ))}
      </nav>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((current) => !current)}
          aria-expanded={isMobileOpen}
          aria-label={isMobileOpen ? "Menü schließen" : "Menü öffnen"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/85 transition hover:border-red-500/50 hover:text-white"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isMobileOpen && (
          <nav className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#111116]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl animate-[navDrop_180ms_ease-out]">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-1"
                >
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`block rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition ${
                      item.cta
                        ? "bg-[#c4001a] text-white"
                        : "text-white/80 hover:bg-[#c4001a]/15 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
