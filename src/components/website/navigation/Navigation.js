"use client";

import { useState } from "react";
import Link from "next/link";
import NavigationItem from "./NavigationItem";
import DropdownMenu from "./DropdownMenu";
import { footballMenuItems } from "./footballMenu";

const navigationItems = [
  { label: "News", href: "/news" },
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
    <nav className="hidden gap-8 text-sm font-bold uppercase text-white/80 lg:flex">
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
  );
}
