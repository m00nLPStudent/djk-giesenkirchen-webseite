import AdminPanel from "@/components/admin/common/AdminPanel";
import UserAvatar from "./UserAvatar";
import UserStatusBadge from "./UserStatusBadge";
import { formatDateTime } from "../helpers/users.formatters";

function RoleChips({ roles = [] }) {
  if (!roles.length) {
    return <span className="text-sm text-white/40">Keine Rolle</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={`${role.id}-${role.is_primary ? "primary" : "secondary"}`}
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
            role.is_primary
              ? "border-red-400/40 bg-red-500/15 text-red-200"
              : "border-white/15 bg-white/[0.06] text-white/70"
          }`}
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}

function ActionButtons({ user, isUpdating, onOpenDetails, onToggleStatus }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled
        title="Bearbeiten folgt in spaeterer Phase."
        className="h-9 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/40"
      >
        Bearbeiten
      </button>

      <button
        type="button"
        onClick={() => onOpenDetails(user.id)}
        className="h-9 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:text-white"
      >
        Details
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onToggleStatus(user.id, !user.is_active)}
        className="h-9 rounded-xl border border-white/15 bg-black/20 px-3 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {user.is_active ? "Deaktivieren" : "Aktivieren"}
      </button>
    </div>
  );
}

export default function UsersTable({ users, updatingUserId, onOpenDetails, onToggleStatus }) {
  return (
    <AdminPanel className="overflow-hidden p-0">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px]">
          <thead className="bg-black/30">
            <tr className="text-left text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
              <th className="px-5 py-4">Benutzer</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Primaere Rolle</th>
              <th className="px-4 py-4">Weitere Rollen</th>
              <th className="px-4 py-4">Letzter Login</th>
              <th className="px-4 py-4">Erstellt am</th>
              <th className="px-4 py-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const secondaryRoles = (user.roles || []).filter((role) => !role.is_primary);
              return (
                <tr key={user.id} className="border-t border-white/10 align-top">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={user} />
                      <div>
                        <p className="font-bold text-white">{user.name}</p>
                        <p className="text-sm text-white/60">{user.email || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><UserStatusBadge isActive={user.is_active} /></td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    {user.primaryRole?.name || "Keine primaere Rolle"}
                  </td>
                  <td className="px-4 py-4">
                    <RoleChips roles={secondaryRoles} />
                  </td>
                  <td className="px-4 py-4 text-sm text-white/70">{formatDateTime(user.last_login_at)}</td>
                  <td className="px-4 py-4 text-sm text-white/70">{formatDateTime(user.created_at)}</td>
                  <td className="px-4 py-4">
                    <ActionButtons
                      user={user}
                      isUpdating={updatingUserId === user.id}
                      onOpenDetails={onOpenDetails}
                      onToggleStatus={onToggleStatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {users.map((user) => {
          const secondaryRoles = (user.roles || []).filter((role) => !role.is_primary);
          return (
            <div key={user.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <UserAvatar user={user} size="sm" />
                  <div>
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-sm text-white/60">{user.email || "-"}</p>
                  </div>
                </div>
                <UserStatusBadge isActive={user.is_active} />
              </div>

              <div className="mt-4 space-y-2 text-sm text-white/70">
                <p><span className="text-white/45">Primaer:</span> {user.primaryRole?.name || "Keine"}</p>
                <p><span className="text-white/45">Weitere:</span></p>
                <RoleChips roles={secondaryRoles} />
                <p><span className="text-white/45">Letzter Login:</span> {formatDateTime(user.last_login_at)}</p>
                <p><span className="text-white/45">Erstellt:</span> {formatDateTime(user.created_at)}</p>
              </div>

              <div className="mt-4">
                <ActionButtons
                  user={user}
                  isUpdating={updatingUserId === user.id}
                  onOpenDetails={onOpenDetails}
                  onToggleStatus={onToggleStatus}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AdminPanel>
  );
}
