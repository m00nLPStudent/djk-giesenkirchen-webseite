"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export default function CoachFilters({ status, setStatus }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3.5 md:p-4">
      <button type="button" aria-expanded={expanded} aria-controls="coach-filter-panel" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex min-w-0 items-center gap-3"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70"><SlidersHorizontal size={16} aria-hidden="true" /></span><span className="text-sm font-black text-white md:text-base">Trainerliste eingrenzen</span>{status !== "alle" ? <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-200">Status aktiv</span> : null}</span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75"><ChevronDown size={16} className={`transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></span>
      </button>
      <div id="coach-filter-panel" className={expanded ? "mt-4" : "hidden"}>
        <label className="block max-w-sm space-y-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 text-white outline-none focus:border-red-500"><option value="alle">Alle</option><option value="aktiv">Aktiv</option><option value="inaktiv">Inaktiv</option></select></label>
      </div>
    </section>
  );
}
