"use client";

import Can from "@/components/admin/auth/Can";
import { removeTeamWithScopeAction } from "@/app/admin/teams/actions";
import ArchiveButton from "@/components/admin/archiving/ArchiveButton";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
} from "@/components/admin/ui/EntityCard";
import { resolveSeasonDisplayName } from "@/lib/football/seasonDisplay";
import useTeamScope from "../useTeamScope";
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
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-black/20 p-4"
        >
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
  const { canAccessTeamInScope } = useTeamScope();
  const hasFootballDe = Boolean(
    team.fussball_de_matches_widget_id || team.fussball_de_table_widget_id,
  );
  const canManageTeam = canAccessTeamInScope(team);
  const seasonName = resolveSeasonDisplayName(team, "-");

  return (
    <EntityCard
      image={team.team_image_url}
      imageAlt={team.name_de}
      imageSize="md"
    >
      <EntityCardBadges>
        <EntityBadge variant="red">
          {team.age_group || "Mannschaft"}
        </EntityBadge>
        <TeamStatusBadge active={team.is_active} />
        <EntityBadge>Saison {seasonName}</EntityBadge>
        <EntityBadge>
          {hasFootballDe ? "fussball.de aktiv" : "fussball.de fehlt"}
        </EntityBadge>
        <EntityBadge>Reihenfolge {team.sort_order ?? 0}</EntityBadge>
      </EntityCardBadges>

      <EntityCardTitle>{team.name_de}</EntityCardTitle>
      <EntityCardMeta>
        {team.description_de || "Keine Beschreibung vorhanden."}
      </EntityCardMeta>

      <TeamInfoGrid team={team} />

      <EntityCardActions>
        {canManageTeam ? (
          <Can permission="teams.edit" uiOnly>
            <EntityActionLink href={`/admin/teams/edit/${team.id}`}>
              Bearbeiten
            </EntityActionLink>
          </Can>
        ) : null}
        <EntityActionLink
          href={`/fussball/${team.slug}`}
          target="_blank"
          variant="primary"
        >
          Ansehen
        </EntityActionLink>
        {canManageTeam ? (
          <Can permission="teams.delete" uiOnly>
            <ArchiveButton
              entity="team"
              name={team.name_de || "Unbekannte Mannschaft"}
              action={removeTeamWithScopeAction.bind(null, team.id)}
              playerAssignments={team.players_count}
              coachAssignments={team.coaches_count}
            />
          </Can>
        ) : null}
      </EntityCardActions>
    </EntityCard>
  );
}
