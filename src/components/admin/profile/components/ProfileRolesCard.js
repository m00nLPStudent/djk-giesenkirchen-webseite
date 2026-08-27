import AdminPanel from "@/components/admin/common/AdminPanel";

function Chip({ children, primary = false }) {
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold ${primary ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-white/15 bg-white/[0.06] text-white/75"}`}>{children}</span>;
}

export default function ProfileRolesCard({ profileData }) {
  const functions = [
    profileData?.linkedCoach ? `Trainer/Betreuer: ${profileData.linkedCoach.label}` : null,
    profileData?.linkedBoardMember ? `Vorstand: ${profileData.linkedBoardMember.label}` : null,
  ].filter(Boolean);
  return (
    <AdminPanel className="space-y-4">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Zuordnung</p><h2 className="mt-1 text-xl font-black text-white">Rollen &amp; Vereinsfunktionen</h2></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">Primäre Rolle</p>{profileData?.primaryRole ? <Chip primary>{profileData.primaryRole.name || profileData.primaryRole.key}</Chip> : <p className="text-sm text-white/50">Keine primäre Rolle.</p>}</div>
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">Weitere Rollen</p><div className="flex flex-wrap gap-2">{profileData?.additionalRoles?.length ? profileData.additionalRoles.map((role) => <Chip key={role.id || role.key}>{role.name || role.key}</Chip>) : <p className="text-sm text-white/50">Keine weiteren Rollen.</p>}</div></div>
      </div>
      {functions.length ? <div className="border-t border-white/10 pt-4"><p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">Vereinsfunktionen</p><div className="flex flex-wrap gap-2">{functions.map((label) => <Chip key={label}>{label}</Chip>)}</div></div> : null}
    </AdminPanel>
  );
}
