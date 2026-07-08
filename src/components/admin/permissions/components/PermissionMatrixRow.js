"use client";

export default function PermissionMatrixRow({
  permission,
  roles,
  assignments,
  onToggle,
  busyKey,
}) {
  return (
    <tr className="h-16 border-t border-white/10 align-middle transition hover:bg-white/[0.03]">
      <td className="sticky left-0 z-[1] bg-[#121217] px-4 py-3">
        <p className="truncate font-bold text-white" title={permission.name}>
          {permission.name}
        </p>
        <p className="mt-1 text-xs text-white/55 break-words leading-5">
          {permission.key}
        </p>
      </td>
      {roles.map((role) => {
        const key = `${role.id}:${permission.id}`;
        const checked = assignments.has(key);
        const busy = busyKey === key;

        return (
          <td key={role.id} className="px-2 py-3 text-center align-middle">
            <label className="inline-flex items-center justify-center">
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
          </td>
        );
      })}
    </tr>
  );
}
