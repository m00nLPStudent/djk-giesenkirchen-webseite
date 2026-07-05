"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchAdminEntities } from "./adminSearch.service";

export default function AdminSearch({ className = "", panelClassName = "" }) {
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await searchAdminEntities(query);
      setResults(data);
      setLoading(false);
      setOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white/70 transition focus-within:border-red-500/70 focus-within:bg-white/[0.07]">
        <Search size={18} className="text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="CMS durchsuchen..."
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
        />
      </div>

      {open && query.length >= 2 && (
        <div
          className={`absolute left-0 right-0 z-50 mt-3 overflow-hidden rounded-3xl border border-white/10 bg-[#18181d] shadow-2xl shadow-black/40 ${panelClassName}`}
        >
          <div className="border-b border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-red-400">
            Suchergebnisse
          </div>

          {loading && (
            <div className="px-5 py-4 text-sm text-white/45">
              Suche läuft...
            </div>
          )}

          {!loading && !results.length && (
            <div className="px-5 py-4 text-sm text-white/45">
              Keine Treffer gefunden.
            </div>
          )}

          {!loading &&
            results.map((result) => (
              <Link
                key={`${result.type}-${result.href}`}
                href={result.href}
                onClick={() => setOpen(false)}
                className="block border-b border-white/5 px-5 py-4 transition last:border-b-0 hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-white">{result.title}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {result.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-600/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-300">
                    {result.type}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
