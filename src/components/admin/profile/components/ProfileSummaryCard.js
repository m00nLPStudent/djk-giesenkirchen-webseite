import AdminPanel from "@/components/admin/common/AdminPanel";
import {
  formatProfileDateTime,
  formatStatusLabel,
} from "../helpers/profile.formatters";

function Row({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/85">{value || "-"}</p>
    </div>
  );
}

export default function ProfileSummaryCard({ profileData }) {
  const canSeeTechnical = Boolean(profileData?.canSeeTechnicalDetails);

  return (
    <AdminPanel className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
          Profil
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Uebersicht</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Name" value={profileData?.fullName} />
        <Row label="E-Mail" value={profileData?.email} />
        <Row label="Status" value={formatStatusLabel(profileData?.isActive)} />
        <Row label="Primaere Rolle" value={profileData?.primaryRole?.name} />
        <Row
          label="Letzte Anmeldung"
          value={formatProfileDateTime(profileData?.lastLoginAt)}
        />
        <Row
          label="Erstellt am"
          value={formatProfileDateTime(profileData?.createdAt)}
        />
        {canSeeTechnical ? (
          <Row label="User-ID" value={profileData?.userId} />
        ) : null}
        {canSeeTechnical ? (
          <Row
            label="Permissions"
            value={String(profileData?.permissionCount || 0)}
          />
        ) : null}
      </div>
    </AdminPanel>
  );
}
