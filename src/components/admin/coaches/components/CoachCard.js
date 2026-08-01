"use client";

import Can from "@/components/admin/auth/Can";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeCoachRecord } from "@/components/admin/delete/removeActions";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
} from "@/components/admin/ui/EntityCard";
import {
  CountryFlag,
  getCountryByValue,
} from "@/components/admin/utils/countries";
import {
  getEntityImage,
  getEntityTeam,
  getFullName,
} from "@/components/admin/utils/entity";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachCard({ coach }) {
  const country = getCountryByValue(coach.nationality);
  const imageUrl = getEntityImage(coach, COACH_PLACEHOLDER_IMAGE);
  const fullName = getFullName(coach, "Trainer");
  const team = getEntityTeam(coach);
  const assignmentLabels =
    (coach.assignments || []).length > 0
      ? coach.assignments.map((assignment) =>
          [assignment.teamNameDe || assignment.teamNameEn, assignment.roleDe || assignment.roleEn]
            .filter(Boolean)
            .join(" · "),
        )
      : [team.name];

  return (
    <EntityCard image={imageUrl} imageAlt={fullName}>
      <EntityCardBadges>
        <EntityBadge variant="red">
          {coach.primaryRoleLabel || "Trainer"}
        </EntityBadge>
        <CoachStatusBadge active={coach.is_active} />
        {assignmentLabels.map((label) => (
          <EntityBadge key={`${coach.id}-${label}`}>{label}</EntityBadge>
        ))}
        {coach.hasMultipleActiveAssignments && (
          <EntityBadge variant="yellow">Mehrfachzuordnung</EntityBadge>
        )}
        {country && (
          <EntityBadge>
            <CountryFlag country={country} />
            {country.de}
          </EntityBadge>
        )}
      </EntityCardBadges>

      <EntityCardTitle>{fullName}</EntityCardTitle>
      <EntityCardMeta>
        {coach.email || "Keine E-Mail hinterlegt"}
      </EntityCardMeta>

      <EntityCardActions>
        <Can permission="coaches.edit" uiOnly fallback={null}>
          {coach._canEditInScope === false ? null : (
            <EntityActionLink href={`/admin/coaches/edit/${coach.id}`}>
              Bearbeiten
            </EntityActionLink>
          )}
        </Can>
        <EntityActionLink href={`/trainer/${coach.slug}`} target="_blank">
          Profil ansehen
        </EntityActionLink>
        <Can permission="coaches.delete" uiOnly fallback={null}>
          {coach._canDeleteInScope === false ? null : (
            <AdminRemoveButton
              label="Trainer"
              name={fullName}
              action={() => removeCoachRecord(coach)}
              affected={["Profil", "Saison-Zuordnungen"]}
              preserved={["Mannschaften", "Spieler", "News"]}
            />
          )}
        </Can>
      </EntityCardActions>
    </EntityCard>
  );
}
