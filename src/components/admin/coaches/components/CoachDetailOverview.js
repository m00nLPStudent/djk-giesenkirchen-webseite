"use client";

import { Pencil } from "lucide-react";
import Can from "@/components/admin/auth/Can";
import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeCoachRecord } from "@/components/admin/delete/removeActions";
import { AdminDangerZone, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";
import CoachAvatar from "./CoachAvatar";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachDetailOverview({ coach, notes = "", canRemove = false }) {
  const name = coach.displayName || "Trainer";
  const teams = (coach.assignments || []).map((item) => [item.teamNameDe || item.teamNameEn, item.roleDe || item.roleEn].filter(Boolean).join(" · "));
  const dangerZone = canRemove ? <Can permission="coaches.delete" uiOnly><AdminDangerZone description="Das bestehende Löschen entfernt das Trainerprofil dauerhaft. Eine Archivfunktion ist nicht vorhanden."><AdminRemoveButton label="Trainer" name={name} action={() => removeCoachRecord(coach)} affected={["Profil", "Saison-Zuordnungen"]} preserved={["Mannschaften", "Spieler", "News"]} /></AdminDangerZone></Can> : null;

  return (
    <AdminDetailLayout
      header={<AdminDetailHeader backHref="/admin/coaches" eyebrow="Trainer" title={name} status={<CoachStatusBadge active={coach.isActive} />} statusPlacement="below" leading={<CoachAvatar coach={coach} sizeClassName="h-16 w-16" />} variant="hero" actions={<a href="#coach-edit-form" className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"><Pencil size={16} aria-hidden="true" /> Bearbeiten</a>} />}
      dangerZone={dangerZone}
    >
      <AdminInformationSection>
        <AdminInformationRow label="Persönliche Daten">{name}{coach.nationality ? ` · ${coach.nationality}` : ""}</AdminInformationRow>
        <AdminInformationRow label="Kontakt">{[coach.email, coach.phone, coach.whatsapp].filter(Boolean).join(" · ")}</AdminInformationRow>
        <AdminInformationRow label="Mannschaften">{teams.length ? teams.join(", ") : coach.teamNames?.join(", ")}</AdminInformationRow>
        <AdminInformationRow label="Lizenzen">{coach.license}</AdminInformationRow>
        <AdminInformationRow label="Notizen">{notes}</AdminInformationRow>
        <AdminInformationRow label="Historie">Keine separate Änderungshistorie vorhanden.</AdminInformationRow>
      </AdminInformationSection>
    </AdminDetailLayout>
  );
}
