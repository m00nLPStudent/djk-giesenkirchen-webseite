"use client";

import { useId, useRef } from "react";

export default function BoardResponsibilitiesList({ responsibilities = [], personName, roleLabel, className = "mt-5" }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const validResponsibilities = responsibilities.filter((item) => typeof item === "string" && item.trim());

  if (!validResponsibilities.length) return null;

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <div className={className}>
      <button ref={triggerRef} type="button" onClick={openDialog} aria-haspopup="dialog" className="inline-flex min-h-11 items-center rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-2 text-left text-sm font-bold text-red-200 transition hover:border-red-300/70 hover:bg-red-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
        Aufgaben &amp; Zust&auml;ndigkeiten
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); closeDialog(); }}
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => { if (event.target === dialogRef.current) closeDialog(); }}
        className="m-auto max-h-[90vh] w-[min(92vw,42rem)] rounded-3xl border border-white/15 bg-zinc-950 p-0 text-white shadow-2xl backdrop:bg-black/80"
      >
        <div className="flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <p className="break-words text-xs font-black uppercase tracking-[0.2em] text-red-400">{roleLabel || "Vorstand"}</p>
              <p className="mt-2 break-words text-lg font-bold text-white">{personName || "Vorstandsmitglied"}</p>
            </div>
            <button type="button" onClick={closeDialog} className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-white/75 transition hover:border-red-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Schlie&szlig;en</button>
          </header>
          <section className="min-h-0 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
            <h2 id={titleId} className="text-xl font-black sm:text-2xl">Aufgaben &amp; Zust&auml;ndigkeiten</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75 sm:text-base">
              {validResponsibilities.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><span aria-hidden="true" className="text-red-400">&bull;</span><span className="min-w-0 break-words">{item}</span></li>)}
            </ul>
          </section>
        </div>
      </dialog>
    </div>
  );
}
