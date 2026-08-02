"use client";

import RoleStatusBadge from "./RoleStatusBadge";
import { formatRoleDateTime } from "../helpers/roles.formatters";
import { AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";
import { AdminButton, AdminDangerZone } from "@/components/admin/design-system";
import Can from "@/components/admin/auth/Can";

export default function RoleDetailsDialog({ role, open, onClose, onEdit, onToggleStatus, isUpdating }) {
  if (!open || !role) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-5 md:max-h-[85vh] md:overflow-y-auto md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">
              Rollen-Details
            </p>
            <h3 className="mt-1 text-2xl font-black text-white">{role.name}</h3>
            <p className="text-sm text-white/60">{role.key}</p>
          </div>
          <div className="flex justify-end">
            <Can permission="roles.edit" uiOnly>
              <AdminButton onClick={() => onEdit(role.id)}>Bearbeiten</AdminButton>
            </Can>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-white/75"
            >
              Schliessen
            </button>
          </div>
        </div>

        <div className="mt-5">
          <RoleStatusBadge isActive={role.is_active} />
        </div>

        <AdminInformationSection title="Rollendaten" className="mt-5">
          <AdminInformationRow label="ID">{role.id}</AdminInformationRow>
          <AdminInformationRow label="Sortierung">{String(role.sort_order ?? 0)}</AdminInformationRow>
          <AdminInformationRow label="Benutzer-Anzahl">{String(role.users_count || 0)}</AdminInformationRow>
          <AdminInformationRow label="Permissions-Anzahl">{String(role.permissions_count || 0)}</AdminInformationRow>
          <AdminInformationRow label="Erstellt">{formatRoleDateTime(role.created_at)}</AdminInformationRow>
          <AdminInformationRow label="Beschreibung">{role.description || "-"}</AdminInformationRow>
        </AdminInformationSection>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
            Benutzer mit dieser Rolle
          </p>
          <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
            {(role.users || []).map((user) => (
              <p key={user.id} className="text-sm text-white/80">
                <span className="font-bold text-white">{user.name}</span>
                {user.email ? ` (${user.email})` : ""}
              </p>
            ))}
            {!role.users?.length && (
              <p className="text-sm text-white/45">
                Keine Benutzer zugewiesen.
              </p>
            )}
          </div>
        </div>

        <Can permission="roles.edit" uiOnly>
          <AdminDangerZone className="mt-5" title={role.is_active ? "Rolle deaktivieren" : "Rolle aktivieren"} description="Der bestehende Aktivstatus der Rolle wird geändert.">
            <AdminButton variant="danger" disabled={isUpdating} onClick={() => onToggleStatus(role.id, role.key, !role.is_active)}>
              {role.is_active ? "Deaktivieren" : "Aktivieren"}
            </AdminButton>
          </AdminDangerZone>
        </Can>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
            Permissions (Read Only)
          </p>
          <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
            {(role.permissions || []).map((permission) => (
              <p key={permission.id} className="text-sm text-white/80">
                <span className="font-bold text-white">{permission.key}</span>
                {permission.category ? ` - ${permission.category}` : ""}
              </p>
            ))}
            {!role.permissions?.length && (
              <p className="text-sm text-white/45">
                Keine Permissions zugewiesen.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
