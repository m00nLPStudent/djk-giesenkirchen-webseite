import AdminPanel from "@/components/admin/common/AdminPanel";
import Can from "@/components/admin/auth/Can";
import PermissionCategoryBadge from "./PermissionCategoryBadge";
import { formatPermissionDateTime } from "../helpers/permissions.formatters";

function ActionButtons({ permission, onOpenDetails, onEdit }) {
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => onOpenDetails(permission.id)}
        className="h-9 w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:bg-white/[0.09] hover:text-white"
      >
        Details
      </button>
      <Can permission="permissions.edit" uiOnly>
        <button
          type="button"
          onClick={() => onEdit(permission.id)}
          className="h-9 w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 text-xs font-bold text-white/80 transition hover:border-red-500/40 hover:bg-white/[0.09] hover:text-white"
        >
          Bearbeiten
        </button>
      </Can>
    </div>
  );
}

export default function PermissionsTable({
  permissions,
  onOpenDetails,
  onEdit,
  onCreate,
}) {
  if (!permissions?.length) {
    return (
      <AdminPanel className="p-7 md:p-8">
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center">
          <p className="text-xl font-black text-white">
            Noch keine Permissions angelegt.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
            Lege die erste Permission an und erweitere danach die Rollen-Matrix.
          </p>
          <Can permission="permissions.edit" uiOnly>
            <button
              type="button"
              onClick={onCreate}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
            >
              Neue Permission
            </button>
          </Can>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel className="overflow-hidden p-0">
      <div className="hidden lg:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[22%]" />
            <col className="w-[12%]" />
            <col className="w-[6%]" />
            <col className="w-[9%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-black/30">
            <tr className="h-12 text-left text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/45">
              <th className="px-4 py-3.5">Permission</th>
              <th className="px-3 py-3.5">Key</th>
              <th className="px-3 py-3.5">Beschreibung</th>
              <th className="px-3 py-3.5">Kategorie</th>
              <th className="px-3 py-3.5 text-center">Rollen</th>
              <th className="px-3 py-3.5">Erstellt</th>
              <th className="px-4 py-3.5">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr
                key={permission.id}
                className="border-t border-white/10 align-top transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3.5 align-middle">
                  <p className="font-bold text-white">{permission.name}</p>
                </td>
                <td className="px-3 py-3.5 text-sm text-white/70 align-middle">
                  <span className="block break-words leading-snug">
                    {permission.key}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-sm text-white/60 align-middle">
                  <p className="line-clamp-2 break-words leading-6">
                    {permission.description || "-"}
                  </p>
                </td>
                <td className="px-3 py-3.5 align-middle">
                  <PermissionCategoryBadge category={permission.category} />
                </td>
                <td className="px-3 py-3.5 text-center text-sm text-white/70 align-middle">
                  {permission.roles_count || 0}
                </td>
                <td className="px-3 py-3.5 text-sm text-white/70 align-middle">
                  <span className="block leading-snug">
                    {formatPermissionDateTime(permission.created_at)}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <ActionButtons
                    permission={permission}
                    onOpenDetails={onOpenDetails}
                    onEdit={onEdit}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {permissions.map((permission) => (
          <div
            key={permission.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="font-bold text-white">{permission.name}</p>
            <p className="mt-1 text-sm text-white/60 break-words">
              {permission.key}
            </p>
            <p className="mt-3 text-sm text-white/65">
              {permission.description || "-"}
            </p>
            <div className="mt-3">
              <PermissionCategoryBadge category={permission.category} />
            </div>
            <p className="mt-3 text-sm text-white/70">
              Rollen: {permission.roles_count || 0}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Erstellt: {formatPermissionDateTime(permission.created_at)}
            </p>
            <div className="mt-4">
              <ActionButtons
                permission={permission}
                onOpenDetails={onOpenDetails}
                onEdit={onEdit}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}
