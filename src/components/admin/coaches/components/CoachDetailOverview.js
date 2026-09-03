"use client";

import Can from "@/components/admin/auth/Can";
import ArchiveButton from "@/components/admin/archiving/ArchiveButton";
import { removeCoachWithScopeAction } from "@/app/admin/coaches/actions";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection, AdminModuleEmptyState, AdminStatusChip } from "@/components/admin/design-system";
import CoachAvatar from "./CoachAvatar";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachDetailOverview({ coach, notes = "", canArchive = false, returnPath = "/admin/coaches" }) {
  const name = coach.displayName || "Trainer";
  const assignments = coach.assignments || [];
  const formatDate = (value) => value ? new Intl.DateTimeFormat("de-DE").format(new Date(value)) : "–";
  const assignmentMeta = assignments.length ? <div className="flex flex-wrap gap-2">{assignments.map((item) => <AdminStatusChip key={item.coachTeamSeasonId || item.teamId} variant="neutral">{item.teamNameDe || item.teamNameEn || "Mannschaft"} · {item.seasonName || "Aktuelle Saison"}</AdminStatusChip>)}</div> : "Keine aktuelle Mannschaftszuordnung";
  const dangerZone = canArchive && coach.isActive ? <Can permission="coaches.delete" uiOnly><AdminDangerZone title="Trainer archivieren" description="Der Trainer wird deaktiviert, aktive Mannschaftszuordnungen enden und die Historie bleibt vollständig erhalten. Er verschwindet aus öffentlichen Bereichen; eine spätere Reaktivierung erzeugt keine automatische Wiederzuordnung."><ArchiveButton entity="coach" name={name} action={removeCoachWithScopeAction.bind(null, coach.id)} coachAssignments={assignments.length} /></AdminDangerZone></Can> : null;

  return (
    <AdminDetailLayout
      header={<AdminDetailHeader backHref={returnPath} backLabel="Zurück zu Trainern" backVariant="pill" eyebrow="Trainer" title={name} status={<CoachStatusBadge active={coach.isActive} />} statusPlacement="below" meta={assignmentMeta} leading={<CoachAvatar coach={coach} sizeClassName="h-16 w-16" />} variant="hero" actions={<AdminActionBar><AdminButton href="#coach-edit-form" variant="primary">Bearbeiten</AdminButton></AdminActionBar>} />}
      dangerZone={dangerZone}
    >
      <AdminInformationSection title="Persönliche Daten"><AdminInformationRow label="Vorname">{coach.firstName}</AdminInformationRow><AdminInformationRow label="Nachname">{coach.lastName}</AdminInformationRow><AdminInformationRow label="Anzeigename">{name}</AdminInformationRow><AdminInformationRow label="Nationalität">{coach.nationality}</AdminInformationRow><AdminInformationRow label="Geburtsdatum">{formatDate(coach.birthDate)}</AdminInformationRow><AdminInformationRow label="Eintrittsdatum">{formatDate(coach.joinedAt)}</AdminInformationRow><AdminInformationRow label="Status">{coach.isActive ? "Aktiv" : "Inaktiv"}</AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Kontakt"><AdminInformationRow label="E-Mail">{coach.email}</AdminInformationRow><AdminInformationRow label="Telefon">{coach.phone}</AdminInformationRow><AdminInformationRow label="Weiteres Telefon">{coach.whatsapp}</AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Mannschaftszuordnungen">{assignments.length ? assignments.map((item) => <AdminInformationRow key={item.coachTeamSeasonId || item.teamId} label={item.teamNameDe || item.teamNameEn || "Mannschaft"}><div className="flex flex-wrap items-center gap-2"><span>{item.roleDe || item.roleEn || "Trainer"}</span><span className="text-white/45">{item.seasonName || "Aktuelle Saison"}</span><AdminStatusChip variant={item.isActive === false ? "warning" : "success"}>{item.isActive === false ? "Inaktiv" : "Aktiv"}</AdminStatusChip></div></AdminInformationRow>) : <div className="pb-5"><AdminModuleEmptyState title="Keine aktuelle Zuordnung" description="Für diesen Trainer liegt keine aktive Mannschaftszuordnung vor." /></div>}</AdminInformationSection>
      <AdminInformationSection title="Lizenzen"><AdminInformationRow label="Lizenz">{coach.license || "Keine Lizenz hinterlegt"}</AdminInformationRow></AdminInformationSection>
      {notes ? <AdminInformationSection title="Notizen"><AdminInformationRow label="Interne Notiz">{notes}</AdminInformationRow></AdminInformationSection> : null}
      {coach.joinedAt || coach.createdAt || coach.updatedAt ? <AdminInformationSection title="Historie">{coach.joinedAt ? <AdminInformationRow label="Vereinsbeitritt">{formatDate(coach.joinedAt)}</AdminInformationRow> : null}{coach.createdAt ? <AdminInformationRow label="Erstellt am">{formatDate(coach.createdAt)}</AdminInformationRow> : null}{coach.updatedAt ? <AdminInformationRow label="Geändert am">{formatDate(coach.updatedAt)}</AdminInformationRow> : null}</AdminInformationSection> : null}
    </AdminDetailLayout>
  );
}
