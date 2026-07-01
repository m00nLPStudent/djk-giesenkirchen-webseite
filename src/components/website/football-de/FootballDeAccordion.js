"use client";

import { useState } from "react";

export default function FootballDeAccordion({ title, description, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 p-6 text-left transition hover:bg-white/[0.03] md:p-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            Spielbetrieb
          </p>
          <h3 className="mt-3 text-3xl font-black text-white">{title}</h3>
          {description && (
            <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
          )}
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-2xl font-black text-white transition">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-white/10 p-6 pt-6 md:p-8">
          {children}
        </div>
      )}
    </section>
  );
}
