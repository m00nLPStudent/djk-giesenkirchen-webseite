"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeTeamRecord } from "@/components/admin/delete/removeActions";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
} from "@/components/admin/ui/EntityCard";
import TeamStatusBadge from "./TeamStatusBadge";

function TeamInfoGrid({ team }) {
  const items = [
    ["Spieler", team.players_count ?? 0],
    ["Trainer", team.coaches_count ?? 0],
    ["Training", team.training_times_de || "Nicht hinterlegt"],
    ["Kontakt", team.contact_name || "Nicht hinterlegt"],
  ];

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {label}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-white/70">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function TeamCard({ team }) {
  const hasFootballDe = Boolean(
    team.fussball_de_matches_widget_id || team.fussball_de_table_widget_id,
  );

  return (
    <EntityCard image={team.team_image_url} imageAlt={team.name_de} imageSize="md">
      <EntityCardBadges>
        <EntityBadge variant="red">{team.age_group || "Mannschaft"}</EntityBadge>
        <TeamStatusBadge active={team.is_active} />
        <EntityBadge>Saison {team.season || "—"}</EntityBadge>
        <EntityBadge>{hasFootballDe ? "fussball.de aktiv" : "fussball.de fehlt"}</EntityBadge>
        <EntityBadge>Reihenfolge {team.sort_order ?? 0}</EntityBadge>
      </EntityCardBadges>

      <EntityCardTitle>{team.name_de}</EntityCardTitle>
      <EntityCardMeta>{team.description_de || "Keine Beschreibung vorhanden."}</EntityCardMeta>

      <TeamInfoGrid team={team} />

      <EntityCardActions>
        <EntityActionLink href={`/admin/teams/edit/${team.id}`}>Bearbeiten</EntityActionLink>
        <EntityActionLink href={`/fussball/${team.slug}`} target="_blank" variant="primary">
          Ansehen
        </EntityActionLink>
        <AdminRemoveButton
          label="Mannschaft"
          name={team.name_de || "Unbekannte Mannschaft"}
          action={() => removeTeamRecord(team)}
          affected={[
            "Mannschaft",
            "alle Saisondaten dieser Mannschaft",
            "Kader-Zuordnungen dieser Mannschaft",
            "Trainer-Zuordnungen dieser Mannschaft",
            "Mannschaftsbilder, sofern vorhanden",
          ]}
          preserved={[
            "Spielerprofile",
            "Trainerprofile",
            "News-Beiträge",
            "Saisons",
            "Abteilungen",
          ]}
        />
      </EntityCardActions>
    </EntityCard>
  );
}
