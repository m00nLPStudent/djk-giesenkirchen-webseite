"use client";

import { getGenderLabel } from "@/constants";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import useDeleteEntity from "@/components/admin/hooks/useDeleteEntity";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityDeleteButton,
} from "@/components/admin/ui/EntityCard";
import { CountryFlag, getCountryByValue } from "@/components/admin/utils/countries";
import { getEntityImage, getEntityTeam, getFullName } from "@/components/admin/utils/entity";
import { deletePlayerCompletely } from "../services/players.service";
import PlayerStatusBadge from "./PlayerStatusBadge";

export default function PlayerCard({ player }) {
  const fullName = getFullName(player, "Unbekannter Spieler");
  const team = getEntityTeam(player);
  const nationality = getCountryByValue(player.nationality);
  const genderLabel = getGenderLabel(player.gender);
  const profileUrl = team.slug ? `/fussball/${team.slug}/spieler/${player.id}` : null;
  const imageUrl = getEntityImage(player, PLAYER_PLACEHOLDER_IMAGE, ["photo_url", "image_url"]);
  const { deleting, handleDelete } = useDeleteEntity({
    entityLabel: "Spieler",
    entityName: fullName,
    deleteAction: () => deletePlayerCompletely(player),
  });

  return (
    <EntityCard image={imageUrl} imageAlt={fullName} imageSize="sm">
      <EntityCardBadges>
        <EntityBadge>{team.name}</EntityBadge>
        {player.position_de && <EntityBadge variant="red">{player.position_de}</EntityBadge>}
        {genderLabel && <EntityBadge>{genderLabel}</EntityBadge>}
        <PlayerStatusBadge active={player.is_active} />
        {player.is_captain && <EntityBadge variant="yellow">Spielführer</EntityBadge>}
        {nationality && (
          <EntityBadge>
            <CountryFlag country={nationality} />
            {nationality.de}
          </EntityBadge>
        )}
      </EntityCardBadges>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        {player.shirt_number && (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl font-black text-white">
            {player.shirt_number}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-black">{fullName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/45">
            <span>
              {player.year_group
                ? `Jahrgang ${player.year_group}`
                : "Jahrgang nicht hinterlegt"}
            </span>
            {player.strong_foot && <span>• {player.strong_foot}</span>}
          </div>
        </div>
      </div>

      {player.description_de && (
        <p className="mt-4 max-w-3xl text-white/60">
          {player.description_de}
        </p>
      )}

      <EntityCardActions>
        <EntityActionLink href={`/admin/players/edit/${player.id}`}>
          Bearbeiten
        </EntityActionLink>
        <EntityActionLink href={profileUrl} target="_blank" variant="primary">
          Profil anzeigen
        </EntityActionLink>
        <EntityDeleteButton onClick={handleDelete} deleting={deleting} />
      </EntityCardActions>
    </EntityCard>
  );
}
