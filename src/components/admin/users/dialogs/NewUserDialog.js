"use client";

import NewUserForm from "../forms/NewUserForm";

export default function NewUserDialog({ open, roles, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">Benutzerverwaltung</p>
            <h3 className="mt-1 text-2xl font-black text-white">Neuer Benutzer</h3>
            <p className="mt-2 text-sm text-white/60">
              Die Eingabeflaeche ist vorbereitet. Das Erzeugen von Auth-Benutzern folgt spaeter.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-white/75"
          >
            Schliessen
          </button>
        </div>

        <div className="mt-5">
          <NewUserForm roles={roles || []} />
        </div>
      </div>
    </div>
  );
}
