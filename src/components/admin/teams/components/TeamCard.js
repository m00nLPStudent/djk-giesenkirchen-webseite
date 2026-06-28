"use client";

import useDeleteEntity from "@/components/admin/hooks/useDeleteEntity";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
  EntityDeleteButton,
} from "@/components/admin/ui/EntityCard";
import { removeTeam } from "../services/teams.service";
import TeamStatusBadge from "./TeamStatusBadge";

export default function TeamCard({ team }) {
  const { deleting, handleDelete } = useDeleteEntity({
    entityLabel: "Mannschaft",
    entityName: team.name_de || "Unbekannte Mannschaft",
    deleteAction: () => removeTeam(team),
  });

  return (
    <EntityCard image={team.team_image_url} imageAlt={team.name_de} imageSize="md">
      <EntityCardBadges>
        <EntityBadge variant="red">{team.age_group || "Mannschaft"}</EntityBadge>
        <TeamStatusBadge active={team.is_active} />
        <EntityBadge>Saison {team.season || "—"}</EntityBadge>
        <EntityBadge>Reihenfolge {team.sort_order ?? 0}</EntityBadge>
      </EntityCardBadges>

      <EntityCardTitle>{team.name_de}</EntityCardTitle>
      <EntityCardMeta>
        {team.description_de || "Keine Beschreibung vorhanden."}
      </EntityCardMeta>

      <EntityCardActions>
        <EntityActionLink href={`/admin/teams/edit/${team.id}`}>
          Bearbeiten
        </EntityActionLink>
        <EntityActionLink href={`/fussball/${team.slug}`} target="_blank" variant="primary">
          Ansehen
        </EntityActionLink>
        <EntityDeleteButton onClick={handleDelete} deleting={deleting} />
      </EntityCardActions>
    </EntityCard>
  );
}
