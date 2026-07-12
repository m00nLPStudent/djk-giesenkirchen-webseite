"use client";

import Can from "@/components/admin/auth/Can";
import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";
import { removeSponsorRecord } from "@/components/admin/delete/removeActions";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
} from "@/components/admin/ui/EntityCard";

export default function SponsorCard({ sponsor }) {
  return (
    <EntityCard image={sponsor.image_url || ""} imageAlt={sponsor.name}>
      <EntityCardBadges>
        <EntityBadge variant="red">
          {sponsor.sponsor_categories?.name_de || "Ohne Kategorie"}
        </EntityBadge>
        <EntityBadge>{sponsor.is_active ? "Aktiv" : "Inaktiv"}</EntityBadge>
        <EntityBadge>Reihenfolge {sponsor.sort_order ?? 0}</EntityBadge>
      </EntityCardBadges>
      <EntityCardTitle>{sponsor.name}</EntityCardTitle>
      <EntityCardMeta>
        {sponsor.website_url ||
          sponsor.description_de ||
          "Keine Beschreibung hinterlegt"}
      </EntityCardMeta>
      <EntityCardActions>
        <Can permission="sponsors.edit" uiOnly>
          <EntityActionLink href={`/admin/sponsors/edit/${sponsor.id}`}>
            Bearbeiten
          </EntityActionLink>
        </Can>
        <Can permission="sponsors.delete" uiOnly>
          <AdminRemoveButton
            label="Sponsor"
            name={sponsor.name}
            action={() => removeSponsorRecord(sponsor)}
            affected={["Sponsor"]}
            preserved={["News", "Mannschaften", "Trainer"]}
          />
        </Can>
      </EntityCardActions>
    </EntityCard>
  );
}
