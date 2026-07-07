"use client";

export default function PermissionMatrixRow({
  permission,
  roles,
  assignments,
  onToggle,
  busyKey,
}) {
  return (
    <tr className="border-t border-white/10 align-top">
      <td className="px-4 py-3">
        <p className="font-bold text-white">{permission.name}</p>
        <p className="mt-1 text-xs text-white/55 break-all">{permission.key}</p>
      </td>
      {roles.map((role) => {
        const key = `${role.id}:${permission.id}`;
        const checked = assignments.has(key);
        const busy = busyKey === key;

        return (
          <td key={role.id} className="px-3 py-3 text-center">
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
