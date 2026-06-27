"use client";

import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
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
import { CountryFlag, getCountryByValue } from "@/components/admin/utils/countries";
import { deleteCoachCompletely } from "../services/coaches.service";
import CoachStatusBadge from "./CoachStatusBadge";

function getTeamName(coach) {
  if (coach.teams?.name_de) return coach.teams.name_de;
  if (coach.team_name) return coach.team_name;
  return "Keine Mannschaft";
}

export default function CoachCard({ coach }) {
  const country = getCountryByValue(coach.nationality);
  const imageUrl = coach.image_url || COACH_PLACEHOLDER_IMAGE;
  const fullName = coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || "Trainer";
  const teamName = getTeamName(coach);
  const { deleting, handleDelete } = useDeleteEntity({
    entityLabel: "Trainer",
    entityName: fullName,
    deleteAction: () => deleteCoachCompletely(coach),
  });

  return (
    <EntityCard image={imageUrl} imageAlt={fullName}>
      <EntityCardBadges>
        <EntityBadge variant="red">{coach.role || "Trainer"}</EntityBadge>
        <CoachStatusBadge active={coach.is_active} />
        <EntityBadge>{teamName}</EntityBadge>
        {country && (
          <EntityBadge>
            <CountryFlag country={country} />
            {country.de}
          </EntityBadge>
        )}
      </EntityCardBadges>

      <EntityCardTitle>{fullName}</EntityCardTitle>
      <EntityCardMeta>{coach.email || "Keine E-Mail hinterlegt"}</EntityCardMeta>

      <EntityCardActions>
        <EntityActionLink href={`/admin/coaches/edit/${coach.id}`}>
          Bearbeiten
        </EntityActionLink>
        <EntityActionLink href={`/trainer/${coach.slug}`} target="_blank">
          Profil ansehen
        </EntityActionLink>
        <EntityDeleteButton onClick={handleDelete} deleting={deleting} />
      </EntityCardActions>
    </EntityCard>
  );
}
