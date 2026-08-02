"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { createElement, useEffect, useRef, useState } from "react";
import { getAdminNavigationIcon } from "./adminNavigation.icons";
import { getNavigationDropdownLayout, getNextNavigationIndex } from "./adminNavigation.uiCore";

function ItemLink({ item, onNavigate, itemRef }) {
  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onNavigate}
      aria-current={item.isActive ? "page" : undefined}
      className={`flex min-h-11 items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
        item.isActive
          ? "border-red-500/40 bg-red-600/15 text-white"
          : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {createElement(getAdminNavigationIcon(item.icon), {
        size: 18,
        className: item.isActive ? "mt-0.5 text-red-300" : "mt-0.5 text-white/45",
      })}
      <span className="min-w-0">
        <span className="block text-sm font-black">{item.label}</span>
        {item.description ? <span className="mt-0.5 block text-xs leading-4 text-white/40">{item.description}</span> : null}
      </span>
    </Link>
  );
}

export default function AdminHorizontalNavigation({ navigation }) {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const triggerRefs = useRef({});
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    function closeOnOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpenKey(null);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape" && openKey) {
        setOpenKey(null);
        triggerRefs.current[openKey]?.focus();
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openKey]);

  function focusItem(index) {
    itemRefs.current[index]?.focus();
  }

  function handleMenuKeyDown(event, items) {
    const current = itemRefs.current.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(getNextNavigationIndex(current, items.length, event.key === "ArrowDown" ? 1 : -1));
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
    }
  }

  return (
    <nav ref={rootRef} aria-label="CMS-Hauptnavigation" className="hidden xl:block">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch gap-1 px-8">
        {navigation.sections.map((section) => {
          const dropdownLayout = getNavigationDropdownLayout(section.items);
          const { visibleItems } = dropdownLayout;
          if (dropdownLayout.key === "empty") return null;
          const direct = visibleItems.length === 1 && visibleItems[0].href === section.href;
          if (direct) {
            return (
              <Link key={section.key} href={section.href} aria-current={section.isActive ? "page" : undefined}
                className={`relative flex items-center gap-2 px-4 text-sm font-black transition ${section.isActive ? "text-red-300" : "text-white/65 hover:text-white"}`}>
                {createElement(getAdminNavigationIcon(section.icon), { size: 17 })}{section.label}
                <span className={`absolute inset-x-3 bottom-0 h-0.5 bg-red-500 transition-opacity ${section.isActive ? "opacity-100" : "opacity-0"}`} />
              </Link>
            );
          }
          const open = openKey === section.key;
          return (
            <div key={section.key} className="relative flex">
              <button type="button" aria-expanded={open} aria-controls={`admin-menu-${section.key}`}
                ref={(node) => { triggerRefs.current[section.key] = node; }}
                onClick={() => setOpenKey(open ? null : section.key)}
                onKeyDown={(event) => {
                  if (["ArrowDown", "Enter", " "].includes(event.key) && !open) {
                    event.preventDefault(); setOpenKey(section.key); setTimeout(() => focusItem(0), 0);
                  }
                }}
                className={`relative flex items-center gap-2 px-4 text-sm font-black transition ${section.isActive ? "text-red-300" : "text-white/65 hover:text-white"}`}>
                {createElement(getAdminNavigationIcon(section.icon), { size: 17 })}{section.label}<ChevronDown size={15} className={open ? "rotate-180 transition" : "transition"} />
                <span className={`absolute inset-x-3 bottom-0 h-0.5 bg-red-500 transition-opacity ${section.isActive ? "opacity-100" : "opacity-0"}`} />
              </button>
              {open ? (
                <div id={`admin-menu-${section.key}`} onKeyDown={(event) => handleMenuKeyDown(event, visibleItems)}
                  className={`absolute left-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-white/10 bg-[#15151a] p-3 shadow-2xl shadow-black/50 ${dropdownLayout.panelClassName}`}>
                  <div className={`grid gap-1 ${dropdownLayout.gridClassName}`}>
                    {visibleItems.map((item, index) => (
                      <div key={item.key} className={["users", "roles", "permissions"].includes(item.key) && item.key === "users" ? "border-t border-white/10 pt-2 sm:col-span-2" : ""}>
                        <ItemLink item={item} onNavigate={() => setOpenKey(null)} itemRef={(node) => { itemRefs.current[index] = node; }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
