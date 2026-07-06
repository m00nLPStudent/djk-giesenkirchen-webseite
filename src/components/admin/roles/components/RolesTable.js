import AdminPanel from "@/components/admin/common/AdminPanel";
import RoleStatusBadge from "./RoleStatusBadge";
import { formatRoleDateTime } from "../helpers/roles.formatters";

function ActionButtons({
  role,
  isUpdating,
  onOpenDetails,
  onEdit,
  onToggleStatus,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onOpenDetails(role.id)}
        className="h-9 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:text-white"
      >
        Details
      </button>

      <button
        type="button"
        onClick={() => onEdit(role.id)}
        className="h-9 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:text-white"
      >
        Bearbeiten
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onToggleStatus(role.id, role.key, !role.is_active)}
        className="h-9 rounded-xl border border-white/15 bg-black/20 px-3 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {role.is_active ? "Deaktivieren" : "Aktivieren"}
      </button>
    </div>
  );
}

export default function RolesTable({
  roles,
  updatingRoleId,
  onOpenDetails,
  onEdit,
  onToggleStatus,
  onCreate,
}) {
  if (!roles?.length) {
    return (
      <AdminPanel className="p-7 md:p-8">
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center">
          <p className="text-xl font-black text-white">
            Noch keine Rollen angelegt.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
            Lege die erste Rolle an, um den Adminbereich sauber zu
            strukturieren.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
          >
            Neue Rolle
          </button>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel className="overflow-hidden p-0">
      <div className="hidden lg:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[15%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-black/30">
            <tr className="text-left text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
              <th className="px-4 py-3">Rolle</th>
              <th className="px-3 py-3">Key</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Sort.</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Perm.</th>
              <th className="px-3 py-3">Erstellt</th>
              <th className="px-3 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-t border-white/10 align-top">
                <td className="px-4 py-3">
                  <p className="font-bold text-white">{role.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">
                    {role.description || "-"}
                  </p>
                </td>
                <td className="px-3 py-3 text-sm text-white/70">
                  <span className="block break-all">{role.key}</span>
                </td>
                <td className="px-3 py-3">
                  <RoleStatusBadge isActive={role.is_active} />
                </td>
                <td className="px-3 py-3 text-sm text-white/70">
                  {role.sort_order ?? 0}
                </td>
                <td className="px-3 py-3 text-sm text-white/70">
                  {role.users_count || 0}
                </td>
                <td className="px-3 py-3 text-sm text-white/70">
                  {role.permissions_count || 0}
                </td>
                <td className="px-3 py-3 text-sm text-white/70">
                  <span className="block break-words">
                    {formatRoleDateTime(role.created_at)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <ActionButtons
                    role={role}
                    isUpdating={updatingRoleId === role.id}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 overflow-x-auto p-4 lg:hidden">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">{role.name}</p>
                <p className="text-sm text-white/60">{role.key}</p>
              </div>
              <RoleStatusBadge isActive={role.is_active} />
            </div>

            <p className="mt-3 text-sm text-white/65">
              {role.description || "-"}
            </p>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>
                <span className="text-white/45">Sortierung:</span>{" "}
                {role.sort_order ?? 0}
              </p>
              <p>
                <span className="text-white/45">Benutzer:</span>{" "}
                {role.users_count || 0}
              </p>
              <p>
                <span className="text-white/45">Permissions:</span>{" "}
                {role.permissions_count || 0}
              </p>
              <p>
                <span className="text-white/45">Erstellt:</span>{" "}
                {formatRoleDateTime(role.created_at)}
              </p>
            </div>

            <div className="mt-4">
              <ActionButtons
                role={role}
                isUpdating={updatingRoleId === role.id}
                onOpenDetails={onOpenDetails}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}
