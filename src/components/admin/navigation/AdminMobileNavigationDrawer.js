"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { createElement, useEffect, useRef, useState } from "react";
import { getAdminNavigationIcon } from "./adminNavigation.icons";
import { getInitialOpenSectionKeys } from "./adminNavigation.uiCore";

export default function AdminMobileNavigationDrawer({ navigation, open, onOpenChange, openerRef }) {
  const closeRef = useRef(null);
  const drawerRef = useRef(null);
  const [expanded, setExpanded] = useState(() => new Set(getInitialOpenSectionKeys(navigation)));

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const opener = openerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function handleKey(event) {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll('button:not([disabled]), a[href]') || [];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      opener?.focus();
    };
  }, [onOpenChange, open, openerRef]);

  function toggleSection(key) {
    setExpanded((current) => {
      return current.has(key) ? new Set() : new Set([key]);
    });
  }

  return (
    <div className="xl:hidden">
      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button type="button" aria-label="Navigation schließen" onClick={() => onOpenChange(false)} className="absolute inset-0 bg-black/75" />
          <aside id="admin-mobile-navigation" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Mobile CMS-Hauptnavigation"
            className="absolute inset-y-0 right-0 flex w-[min(92vw,25rem)] flex-col border-l border-white/10 bg-[#111116] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-black">CMS-Navigation</p>
              <button ref={closeRef} type="button" onClick={() => onOpenChange(false)} aria-label="Navigation schließen"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"><X size={20} /></button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile CMS-Hauptnavigation">
              <div className="space-y-2">
                {navigation.sections.map((section) => {
                  const direct = section.items.length === 1 && section.items[0].href === section.href;
                  if (direct) return (
                    <Link key={section.key} href={section.href} onClick={() => onOpenChange(false)} aria-current={section.isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-4 font-black ${section.isActive ? "bg-red-600/15 text-red-200" : "text-white/75"}`}>
                      {createElement(getAdminNavigationIcon(section.icon), { size: 19 })}{section.label}
                    </Link>
                  );
                  const isExpanded = expanded.has(section.key);
                  return (
                    <section key={section.key} className="rounded-xl border border-white/10 bg-white/[0.025]">
                      <button type="button" onClick={() => toggleSection(section.key)} aria-expanded={isExpanded} aria-controls={`mobile-section-${section.key}`}
                        className={`flex min-h-11 w-full items-center gap-3 px-4 text-left font-black ${section.isActive ? "text-red-200" : "text-white/75"}`}>
                        {createElement(getAdminNavigationIcon(section.icon), { size: 19 })}<span className="flex-1">{section.label}</span><ChevronDown size={17} className={isExpanded ? "rotate-180" : ""} />
                      </button>
                      {isExpanded ? (
                        <div id={`mobile-section-${section.key}`} className="space-y-1 border-t border-white/10 p-2">
                          {section.items.map((item) => {
                            return <Link key={item.key} href={item.href} onClick={() => onOpenChange(false)} aria-current={item.isActive ? "page" : undefined}
                              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold ${item.isActive ? "bg-red-600/15 text-red-200" : "text-white/65"}`}>
                              {createElement(getAdminNavigationIcon(item.icon), { size: 17 })}<span className="min-w-0 break-words">{item.label}</span>
                            </Link>;
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
