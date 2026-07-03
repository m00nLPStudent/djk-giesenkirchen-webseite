"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Newspaper, Shield, UserRound, Users, Building2, Handshake } from "lucide-react";

export default function AdminCreateMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-700"
      >
        <Plus size={18} />
        Neu
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#18181d] shadow-2xl">
          <Link href="/admin/news/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <Newspaper size={18} />
            Neue News
          </Link>
          <Link href="/admin/sponsors/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <Handshake size={18} />
            Neuer Sponsor
          </Link>
          <Link href="/admin/department/board/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <Building2 size={18} />
            Neues Vorstandsmitglied
          </Link>
          <Link href="/admin/teams/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <Shield size={18} />
            Neue Mannschaft
          </Link>
          <Link href="/admin/coaches/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <UserRound size={18} />
            Neuer Trainer
          </Link>
          <Link href="/admin/players/new" className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white">
            <Users size={18} />
            Neuer Spieler
          </Link>
        </div>
      )}
    </div>
  );
}
