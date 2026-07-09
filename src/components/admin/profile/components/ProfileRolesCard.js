import AdminPanel from "@/components/admin/common/AdminPanel";

function RoleChip({ role, primary = false }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-[0.1em] ${
        primary
          ? "border-red-400/40 bg-red-500/15 text-red-200"
          : "border-white/15 bg-white/[0.06] text-white/75"
      }`}
    >
      {role?.name || role?.key}
    </span>
  );
}

export default function ProfileRolesCard({ profileData }) {
  const primaryRole = profileData?.primaryRole;
  const additionalRoles = profileData?.additionalRoles || [];

  return (
    <AdminPanel className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Rollen
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Rollenzuordnung</h2>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
          Primaere Rolle
        </p>
        {primaryRole ? (
          <RoleChip role={primaryRole} primary />
        ) : (
          <p className="text-sm text-white/50">Keine primaere Rolle gesetzt.</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
          Weitere Rollen
        </p>
        {additionalRoles.length ? (
          <div className="flex flex-wrap gap-2">
            {additionalRoles.map((role) => (
              <RoleChip key={role.id || role.key} role={role} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">Keine weiteren Rollen.</p>
        )}
      </div>
    </AdminPanel>
  );
}
