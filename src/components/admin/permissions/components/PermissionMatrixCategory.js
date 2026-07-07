"use client";

import PermissionMatrixRow from "./PermissionMatrixRow";

export default function PermissionMatrixCategory({
  category,
  permissions,
  roles,
  assignments,
  onToggle,
  busyKey,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.22em] text-red-300">
        {category}
      </h3>

      <div className="mt-3 hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/45">
              <th className="px-4 py-2">Permission</th>
              {roles.map((role) => (
                <th key={role.id} className="px-3 py-2 text-center">
                  {role.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <PermissionMatrixRow
                key={permission.id}
                permission={permission}
                roles={roles}
                assignments={assignments}
                onToggle={onToggle}
                busyKey={busyKey}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-3 lg:hidden">
        {permissions.map((permission) => (
          <div
            key={permission.id}
            className="rounded-xl border border-white/10 bg-black/25 p-3"
          >
            <p className="font-bold text-white">{permission.name}</p>
            <p className="text-xs text-white/55 break-all">{permission.key}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {roles.map((role) => {
                const key = `${role.id}:${permission.id}`;
                const checked = assignments.has(key);
                const busy = busyKey === key;
                return (
                  <label
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80"
                  >
                    <span className="mr-3 truncate">{role.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busy}
                      onChange={(event) =>
                        onToggle({
                          roleId: role.id,
                          permissionId: permission.id,
                          checked: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-black/30"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
