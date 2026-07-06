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

export default function UsersTable({
  users,
  updatingUserId,
  onOpenDetails,
  onToggleStatus,
  onCreate,
}) {
  if (!users?.length) {
    return (
      <AdminPanel className="p-7 md:p-8">
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center">
          <p className="text-xl font-black text-white">
            Noch keine Benutzer angelegt.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
            Benutzer werden spaeter ueber die Auth-Verwaltung angelegt.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
          >
            Neuer Benutzer
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
            <col className="w-[11%]" />
            <col className="w-[14%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-black/30">
            <tr className="text-left text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
              <th className="px-4 py-3">Benutzer</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Primaer</th>
              <th className="px-3 py-3">Weitere Rollen</th>
              <th className="px-3 py-3">Letzter Login</th>
              <th className="px-3 py-3">Erstellt</th>
              <th className="px-3 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const secondaryRoles = (user.roles || []).filter(
                (role) => !role.is_primary,
              );
              return (
                <tr
                  key={user.id}
                  className="border-t border-white/10 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="font-bold text-white">{user.name}</p>
                        <p className="truncate text-sm text-white/60">
                          {user.email || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <UserStatusBadge isActive={user.is_active} />
                  </td>
                  <td className="px-3 py-3 text-sm text-white/75">
                    <span className="line-clamp-2">
                      {user.primaryRole?.name || "Keine primaere Rolle"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <RoleChips roles={secondaryRoles} />
                  </td>
                  <td className="px-3 py-3 text-sm text-white/70">
                    {formatDateTime(user.last_login_at)}
                  </td>
                  <td className="px-3 py-3 text-sm text-white/70">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="px-3 py-3">
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

      <div className="grid gap-3 overflow-x-auto p-4 lg:hidden">
        {users.map((user) => {
          const secondaryRoles = (user.roles || []).filter(
            (role) => !role.is_primary,
          );
          return (
            <div
              key={user.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
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
                <p>
                  <span className="text-white/45">Primaer:</span>{" "}
                  {user.primaryRole?.name || "Keine"}
                </p>
                <p>
                  <span className="text-white/45">Weitere:</span>
                </p>
                <RoleChips roles={secondaryRoles} />
                <p>
                  <span className="text-white/45">Letzter Login:</span>{" "}
                  {formatDateTime(user.last_login_at)}
                </p>
                <p>
                  <span className="text-white/45">Erstellt:</span>{" "}
                  {formatDateTime(user.created_at)}
                </p>
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
