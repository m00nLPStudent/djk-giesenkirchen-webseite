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
import { getEntityImage, getEntityTeam, getFullName } from "@/components/admin/utils/entity";
import { deleteCoachCompletely } from "../services/coaches.service";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachCard({ coach }) {
  const country = getCountryByValue(coach.nationality);
  const imageUrl = getEntityImage(coach, COACH_PLACEHOLDER_IMAGE);
  const fullName = getFullName(coach, "Trainer");
  const team = getEntityTeam(coach);
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
        <EntityBadge>{team.name}</EntityBadge>
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
