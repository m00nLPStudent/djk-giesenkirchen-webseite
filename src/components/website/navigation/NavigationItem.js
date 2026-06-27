"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function NavigationItem({ item, openMenu, setOpenMenu }) {
  const hasChildren = item.children?.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setOpenMenu(item.label)}
      onMouseLeave={() => hasChildren && setOpenMenu(null)}
    >
      <Link
        href={item.href}
        className="flex items-center gap-1 uppercase transition hover:text-red-500"
      >
        {item.label}

        {hasChildren && <ChevronDown size={16} />}
      </Link>

      {hasChildren && openMenu === item.label && item.dropdown}
    </div>
  );
}
