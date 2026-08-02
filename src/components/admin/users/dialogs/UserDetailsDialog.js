"use client";

import UserAvatar from "../components/UserAvatar";
import UserStatusBadge from "../components/UserStatusBadge";
import { formatDateTime } from "../helpers/users.formatters";
import { AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";
import { AdminButton, AdminDangerZone } from "@/components/admin/design-system";
import Can from "@/components/admin/auth/Can";

export default function UserDetailsDialog({ user, open, onClose, onEdit, onToggleStatus, isUpdating, currentUserId }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <div className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-5 md:max-h-[85vh] md:overflow-y-auto md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">
                Benutzerdetails
              </p>
              <h3 className="mt-1 text-2xl font-black text-white">
                {user.name}
              </h3>
              <p className="text-sm text-white/60">{user.email || "-"}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Can permission="users.edit" uiOnly>
              <AdminButton onClick={() => onEdit(user.id)}>Bearbeiten</AdminButton>
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
          <UserStatusBadge isActive={user.is_active} />
        </div>

        <AdminInformationSection title="Benutzerkonto" className="mt-5">
          <AdminInformationRow label="User-ID">{user.id}</AdminInformationRow>
          <AdminInformationRow label="Erstellt">{formatDateTime(user.created_at)}</AdminInformationRow>
          <AdminInformationRow label="Letzter Login">{formatDateTime(user.last_login_at)}</AdminInformationRow>
          <AdminInformationRow label="Primäre Rolle">{user.primaryRole?.name || "Keine primäre Rolle"}</AdminInformationRow>
        </AdminInformationSection>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
            Alle Rollen
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.roles || []).map((role) => (
              <span
                key={role.id}
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
                  role.is_primary
                    ? "border-red-400/40 bg-red-500/15 text-red-200"
                    : "border-white/15 bg-white/[0.06] text-white/70"
                }`}
              >
                {role.name}
              </span>
            ))}
            {!user.roles?.length && (
              <p className="text-sm text-white/45">Keine Rollen zugewiesen.</p>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
            Permissions (Read Only)
          </p>
          <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
            {(user.permissions || []).map((permission) => (
              <p key={permission.id} className="text-sm text-white/75">
                <span className="font-bold text-white/90">
                  {permission.key}
                </span>
                {permission.category ? ` - ${permission.category}` : ""}
              </p>
            ))}
            {!user.permissions?.length && (
              <p className="text-sm text-white/45">
                Keine Permissions zugeordnet.
              </p>
            )}
          </div>
        </div>

        <Can permission="users.edit" uiOnly>
          <AdminDangerZone className="mt-5" title={user.is_active ? "Benutzer deaktivieren" : "Benutzer aktivieren"} description="Der bestehende Aktivstatus des Benutzerkontos wird geändert.">
            <AdminButton variant="danger" disabled={isUpdating || (currentUserId === user.id && user.is_active)} onClick={() => onToggleStatus(user.id, !user.is_active)}>
              {user.is_active ? "Deaktivieren" : "Aktivieren"}
            </AdminButton>
          </AdminDangerZone>
        </Can>
      </div>
    </div>
  );
}
