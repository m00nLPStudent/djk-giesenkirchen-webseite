"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function DropdownMenu({ items }) {
  return (
    <div className="w-[26rem] origin-top overflow-hidden rounded-[2rem] border border-white/10 bg-[#111116]/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-[navDrop_180ms_ease-out]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a33,transparent_45%)]" />

      <div className="relative p-4">
        <div className="mb-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff4b5f]">
            Fußballbereich
          </p>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Mannschaften, Trainer, Spielbetrieb und weitere Infos der Fußballabteilung.
          </p>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.025] p-1 transition hover:border-[#c4001a]/40 hover:bg-[#c4001a]/10">
              <Link
                href={item.href}
                className="group flex items-center justify-between rounded-xl px-4 py-3 font-black text-white/80 transition hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#c4001a] opacity-60 transition group-hover:scale-125 group-hover:opacity-100" />
                  {item.label}
                </span>

                {item.children?.length > 0 && (
                  <ChevronRight size={18} className="text-white/35 transition group-hover:translate-x-1 group-hover:text-[#ff4b5f]" />
                )}
              </Link>

              {item.children?.length > 0 && (
                <div className="ml-6 mt-1 space-y-1 border-l border-[#c4001a]/25 pb-2 pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="block rounded-xl px-3 py-2 text-sm font-bold text-white/55 transition hover:bg-[#c4001a]/15 hover:text-white hover:pl-4"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
