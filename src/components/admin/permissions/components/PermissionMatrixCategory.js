"use client";

import PermissionMatrixRow from "./PermissionMatrixRow";

export default function PermissionMatrixCategory({
  category,
  permissions,
  roles,
  assignments,
  canEdit,
  onToggle,
  busyKey,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-black uppercase tracking-[0.22em] text-red-300">
        {category}
      </h3>

      <div className="mt-3 hidden lg:block overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[980px] w-max table-fixed border-collapse">
          <colgroup>
            <col className="w-[320px] min-w-[320px]" />
            {roles.map((role) => (
              <col key={role.id} className="w-[128px] min-w-[128px]" />
            ))}
          </colgroup>
          <thead>
            <tr className="h-12 text-left text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/45">
              <th className="sticky left-0 top-0 z-20 border-b border-white/10 bg-[#15151a] px-4 py-3 text-left">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="sticky top-0 z-10 border-b border-white/10 bg-[#15151a] px-2 py-3 text-center"
                  title={role.name}
                >
                  <span className="block break-words text-[0.6rem] leading-4">
                    {role.key}
                  </span>
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
                canEdit={canEdit}
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
                    {canEdit ? (
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
                    ) : null}
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
