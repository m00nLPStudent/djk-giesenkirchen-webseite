"use client";

import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeBoardMemberRecord } from "@/components/admin/delete/removeActions";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import { EntityActionLink, EntityCard, EntityCardActions, EntityCardBadges, EntityCardMeta, EntityCardTitle } from "@/components/admin/ui/EntityCard";
import { BOARD_PLACEHOLDER_IMAGE } from "../services/board.service";

function getFullName(member) {
  return `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Vorstandsmitglied";
}

export default function BoardMemberCard({ member }) {
  const fullName = getFullName(member);

  return (
    <EntityCard image={member.image_url || BOARD_PLACEHOLDER_IMAGE} imageAlt={fullName}>
      <EntityCardBadges>
        <EntityBadge variant="red">{member.role_de}</EntityBadge>
        <EntityBadge>{member.is_active ? "Aktiv" : "Inaktiv"}</EntityBadge>
        <EntityBadge>Reihenfolge {member.sort_order ?? 0}</EntityBadge>
      </EntityCardBadges>
      <EntityCardTitle>{fullName}</EntityCardTitle>
      <EntityCardMeta>{[member.email, member.phone].filter(Boolean).join(" · ")}</EntityCardMeta>
      <EntityCardActions>
        <EntityActionLink href={`/admin/department/board/edit/${member.id}`}>Bearbeiten</EntityActionLink>
        <AdminRemoveButton
          label="Vorstandsmitglied"
          name={fullName}
          action={() => removeBoardMemberRecord(member)}
          affected={["Vorstandsprofil"]}
          preserved={["Trainer", "Mannschaften", "News"]}
        />
      </EntityCardActions>
    </EntityCard>
  );
}
