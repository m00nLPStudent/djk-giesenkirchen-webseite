"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function NavigationItem({ item, openMenu, setOpenMenu }) {
  const hasChildren = item.children?.length > 0;
  const isOpen = openMenu === item.label;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setOpenMenu(item.label)}
      onMouseLeave={() => hasChildren && setOpenMenu(null)}
    >
      <Link
        href={item.href}
        className={`group relative flex items-center gap-2 rounded-full px-4 py-3 transition duration-300 ${
          isOpen
            ? "bg-[#c4001a] text-white shadow-lg shadow-red-950/40"
            : "hover:bg-[#c4001a]/15 hover:text-white"
        }`}
      >
        <span className="relative z-10">{item.label}</span>

        {hasChildren && (
          <ChevronDown
            size={16}
            className={`relative z-10 transition duration-300 ${isOpen ? "rotate-180" : "group-hover:rotate-180"}`}
          />
        )}

        <span className="pointer-events-none absolute inset-x-4 -bottom-1 h-0.5 scale-x-0 rounded-full bg-[#c4001a] transition duration-300 group-hover:scale-x-100" />
      </Link>

      {hasChildren && isOpen && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4">
          {item.dropdown}
        </div>
      )}
    </div>
  );
}
