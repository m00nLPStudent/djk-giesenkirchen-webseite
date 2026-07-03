"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserCog, UserCircle } from "lucide-react";

export default function ProfileMenu() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClick(event) {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-red-500/70 hover:bg-white/[0.07]"
      >
        <UserCircle size={27} className="text-white/75" />
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-black text-white">Swen Verbocket</p>
          <p className="text-xs text-white/40">Administrator</p>
        </div>
        <ChevronDown size={16} className={`text-white/45 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#18181d] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-black">Swen Verbocket</p>
            <p className="mt-1 text-xs text-white/45">Administrator</p>
          </div>

          <button type="button" className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-bold text-white/75 transition hover:bg-white/5 hover:text-white">
            <UserCog size={18} />
            Profil anpassen
          </button>

          <button type="button" className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-left text-sm font-bold text-red-300 transition hover:bg-red-600/10 hover:text-red-200">
            <LogOut size={18} />
            Ausloggen
          </button>
        </div>
      )}
    </div>
  );
}
