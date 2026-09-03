import { FormAlert } from "@/components/admin/forms";
import ArchiveButton from "@/components/admin/archiving/ArchiveButton";
import { loadPlayerArchivePreviewAction, removePlayerWithScopeAction } from "@/app/admin/players/actions";
import { formatContributionAmount, formatContributionDate } from "@/components/admin/contributions/helpers/contributionFormatters";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection, AdminMetric, AdminModuleEmptyState, AdminModuleSummary } from "@/components/admin/design-system";
import ContributionStatusBadge from "@/components/admin/contributions/components/ContributionStatusBadge";
import PlayerAvatar from "./PlayerAvatar";
import PlayerStatusBadge from "./PlayerStatusBadge";

function valueOrDash(value) {
  return value || "–";
}

export default function PlayerContributionDetailView({ player, canEdit = false, canArchive = false, contributionStatus = null, contributionVisibility = "none", contributionSeasonWarning = "", basePath = "/admin/players", sportContext = "global" }) {
  const teamLabels = player.teamNames?.length ? player.teamNames.join(" · ") : "Nicht zugeordnet";
  const seasonLabel = player.primaryAssignment?.seasonName || "Keine Saison";
  const canOpenContribution = contributionVisibility === "full" && contributionStatus?.contributionId;
  const hasHeaderActions = canOpenContribution || canEdit;
  const headerActions = hasHeaderActions ? (
    <AdminActionBar>
      {canOpenContribution ? <AdminButton href={`/admin/contributions/${contributionStatus.contributionId}`}>Beitrag öffnen</AdminButton> : null}
      {canEdit ? <AdminButton href={`${basePath}/edit/${player.id}`} variant="primary">Bearbeiten</AdminButton> : null}
    </AdminActionBar>
  ) : null;
  const dangerZone = canArchive && player.isActive ? (
    <div id="player-danger-zone" className="scroll-mt-28">
      <AdminDangerZone description="Der Spieler wird inaktiv und aktive Mannschaftszuordnungen werden beendet. Bestehende Beitragsdaten bleiben erhalten.">
        <ArchiveButton entity="player" name={player.displayName} action={removePlayerWithScopeAction.bind(null, player.id)} previewAction={loadPlayerArchivePreviewAction.bind(null, player.id)} />
      </AdminDangerZone>
    </div>
  ) : null;

  return (
    <AdminDetailLayout
      header={<AdminDetailHeader backHref={basePath} backLabel="Zurück zu Spielern" backVariant="pill" title={player.displayName} leading={<PlayerAvatar player={player} sizeClassName="h-16 w-16" />} status={<PlayerStatusBadge active={player.isActive} />} meta={`${teamLabels} · ${seasonLabel}`} actions={headerActions} />}
      dangerZone={dangerZone}
    >
      {contributionSeasonWarning ? <FormAlert className="border-amber-400/30 bg-amber-500/10 text-amber-50" tone="warning">{contributionSeasonWarning}</FormAlert> : null}

      <AdminInformationSection title="Spielerinformationen">
        <AdminInformationRow label="Persönliche Daten">{[player.displayName, player.birthdate ? `Geburtsdatum ${formatContributionDate(player.birthdate)}` : null, player.nationality].filter(Boolean).join(" · ")}</AdminInformationRow>
        <AdminInformationRow label="Mannschaft">{teamLabels}</AdminInformationRow>
        <AdminInformationRow label="Saison">{seasonLabel}</AdminInformationRow>
        {sportContext === "table_tennis" ? <AdminInformationRow label="Starke Hand">{valueOrDash(player.strongHand)}</AdminInformationRow> : <>
          <AdminInformationRow label="Position">{valueOrDash(player.positionDe || player.positionEn)}</AdminInformationRow>
          <AdminInformationRow label="Rückennummer">{player.shirtNumber ?? "–"}</AdminInformationRow>
          <AdminInformationRow label="Starker Fuß">{valueOrDash(player.strongFoot)}</AdminInformationRow>
        </>}
        <AdminInformationRow label="Status"><PlayerStatusBadge active={player.isActive} /></AdminInformationRow>
        <AdminInformationRow label="Notizen">{valueOrDash(player.descriptionDe || player.descriptionEn)}</AdminInformationRow>
        <AdminInformationRow label="Historie">{[player.joinedAt ? `Eintritt ${formatContributionDate(player.joinedAt)}` : null, player.createdAt ? `Erstellt ${formatContributionDate(player.createdAt)}` : null].filter(Boolean).join(" · ") || "–"}</AdminInformationRow>
      </AdminInformationSection>

      {contributionVisibility !== "none" && !contributionSeasonWarning ? (
        contributionStatus?.hasContribution ? (
          <AdminInformationSection title="Vereinsbeitrag">
            <AdminInformationRow label="Übersicht"><AdminModuleSummary><AdminMetric label="Status" value={contributionStatus.displayStatus} />{contributionVisibility === "full" ? <AdminMetric label="Soll" value={formatContributionAmount(contributionStatus.amountDue)} /> : null}{contributionVisibility === "full" ? <AdminMetric label="Gezahlt" value={formatContributionAmount(contributionStatus.amountPaid)} /> : null}<AdminMetric label="Offen" value={formatContributionAmount(contributionStatus.amountOutstanding)} /><AdminMetric label="Fälligkeit" value={formatContributionDate(contributionStatus.dueDate)} /></AdminModuleSummary></AdminInformationRow>
            <AdminInformationRow label="Beitragsstatus"><ContributionStatusBadge status={contributionStatus.status} isOverdue={contributionStatus.isOverdue} compact shortLabel={false} /></AdminInformationRow>
          </AdminInformationSection>
        ) : <AdminModuleEmptyState title="Kein Vereinsbeitrag" description="Für die aktuelle Saison ist kein Vereinsbeitrag angelegt." />
      ) : null}
    </AdminDetailLayout>
  );
}
