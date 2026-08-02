"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { adminUi } from "./tokens";

export function AdminModuleFilters({ title = "Filter", badge = null, children, defaultExpanded = false, panelId = "admin-filter-panel", className = "" }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <section className={`${adminUi.panel} p-3.5 md:p-4 ${className}`}>
      <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex min-w-0 items-center gap-3"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70"><SlidersHorizontal size={16} aria-hidden="true" /></span><span className="text-sm font-black text-white md:text-base">{title}</span>{badge}</span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75"><ChevronDown size={16} className={`transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></span>
      </button>
      <div id={panelId} className={expanded ? "mt-4" : "hidden"}>{children}</div>
    </section>
  );
}
