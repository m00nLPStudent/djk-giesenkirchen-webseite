"use client";

import { useState } from "react";
import NavigationItem from "./NavigationItem";
import DropdownMenu from "./DropdownMenu";
import { footballMenuItems } from "./footballMenu";

const newsMenuItems = [
  { label: "News", href: "/" },
  { label: "News Übersicht", href: "/news/uebersicht" },
];

const navigationItems = [
  {
    label: "News",
    href: "/",
    children: newsMenuItems,
  },
  {
    label: "Fußball",
    href: "/fussball",
    children: footballMenuItems,
  },
  { label: "Tischtennis", href: "/tischtennis" },
  { label: "Damen-Gymnastik", href: "/damen-gymnastik" },
  { label: "Termine", href: "/termine" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Navigation() {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1.5 text-sm font-black uppercase tracking-[0.12em] text-white/75 lg:flex">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          item={{
            ...item,
            dropdown: item.children ? <DropdownMenu items={item.children} /> : null,
          }}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        />
      ))}
    </nav>
  );
}
