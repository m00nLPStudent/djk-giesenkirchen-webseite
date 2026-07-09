import AdminPanel from "@/components/admin/common/AdminPanel";

export default function ProfilePermissionsCard({ profileData }) {
  const permissions = profileData?.permissions || [];

  return (
    <AdminPanel className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Rechte
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Permissions</h2>
      </div>

      <p className="text-sm text-white/70">
        Insgesamt zugewiesen: <strong>{permissions.length}</strong>
      </p>

      <div className="max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
        {permissions.length ? (
          <div className="space-y-2">
            {permissions.map((permission) => (
              <p
                key={permission.id || permission.key}
                className="text-sm text-white/75"
              >
                <span className="font-bold text-white/90">
                  {permission.name || permission.key}
                </span>
                {permission.key ? (
                  <span className="text-white/50"> ({permission.key})</span>
                ) : null}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/50">Keine Permissions gefunden.</p>
        )}
      </div>
    </AdminPanel>
  );
}
