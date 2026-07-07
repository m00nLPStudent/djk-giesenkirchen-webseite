"use client";

import PermissionCategoryBadge from "./PermissionCategoryBadge";
import { formatPermissionDateTime } from "../helpers/permissions.formatters";

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/85">{value || "-"}</p>
    </div>
  );
}

export default function PermissionDetailsDialog({ permission, open, onClose }) {
  if (!open || !permission) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-5 md:max-h-[85vh] md:overflow-y-auto md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">
              Permission-Details
            </p>
            <h3 className="mt-1 text-2xl font-black text-white">
              {permission.name}
            </h3>
            <p className="text-sm text-white/60 break-all">{permission.key}</p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-white/75"
            >
              Schliessen
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-2">
          <DetailRow label="ID" value={permission.id} />
          <DetailRow
            label="Erstellt"
            value={formatPermissionDateTime(permission.created_at)}
          />
          <DetailRow
            label="Beschreibung"
            value={permission.description || "-"}
          />
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
              Kategorie
            </p>
            <div className="mt-2">
              <PermissionCategoryBadge category={permission.category} />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
            Rollen mit dieser Permission (Read Only)
          </p>
          <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
            {(permission.roles || []).map((role) => (
              <p key={role.id} className="text-sm text-white/80">
                {role.name}
              </p>
            ))}
            {!permission.roles?.length && (
              <p className="text-sm text-white/45">Keine Rollen zugeordnet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
