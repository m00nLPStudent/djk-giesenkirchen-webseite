"use client";

import { useState } from "react";
import Link from "next/link";
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
    href: "/",
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

  return (
    <>
      <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-1 text-[0.72rem] font-black uppercase tracking-[0.1em] text-white/75 lg:flex">
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

      <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1.5 text-sm font-black uppercase tracking-[0.1em] text-white/75 lg:hidden">
        {navigationItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 transition duration-300 ${
              item.cta
                ? "bg-[#c4001a] text-white shadow-lg shadow-red-950/35 hover:bg-[#a90016]"
                : "hover:bg-[#c4001a]/15 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
