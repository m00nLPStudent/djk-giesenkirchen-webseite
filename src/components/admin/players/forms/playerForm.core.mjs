export function getInitialAssignment(playerSeasonalReadModel) {
  if (playerSeasonalReadModel?.hasMultipleActiveAssignments) {
    return null;
  }

  return playerSeasonalReadModel?.primaryAssignment || null;
}

export function createInitialPlayerFormData(
  player,
  playerSeasonalReadModel,
  placeholderImage,
) {
  const primaryAssignment = getInitialAssignment(playerSeasonalReadModel);

  return {
    team_season_id: primaryAssignment?.teamSeasonId || "",
    first_name: player?.first_name || "",
    last_name: player?.last_name || "",
    shirt_number: primaryAssignment?.shirtNumber ?? "",
    position_de: primaryAssignment?.positionDe || "",
    position_en: primaryAssignment?.positionEn || "",
    image_url: player?.image_url || player?.photo_url || placeholderImage,
    image_media_asset_id: player?.image_media_asset_id || null,
    description_de: player?.description_de || "",
    description_en: player?.description_en || "",
    birthdate: player?.birthdate || "",
    joined_at: player?.joined_at || "",
    strong_foot: player?.strong_foot || "",
    strong_hand: player?.strong_hand || "",
    nationality: player?.nationality || "",
    gender: player?.gender || "",
    assignment_sort_order: primaryAssignment?.sortOrder ?? 0,
    is_active: player?.is_active ?? true,
    is_captain: primaryAssignment?.isCaptain ?? false,
  };
}

export function getYearGroupFromBirthdate(birthdate) {
  if (!birthdate) return "";
  return String(new Date(birthdate).getFullYear());
}

export function createPlayerPayloadData(form, yearGroup, placeholderImage) {
  return {
    ...form,
    image_url: form.image_url || placeholderImage,
    image_media_asset_id: form.image_media_asset_id || null,
    year_group: yearGroup,
  };
}

export function getPlayerFormBlockingMessageData(
  teamOptionsResult,
  playerSeasonalReadModel,
  currentSeasonStatuses,
) {
  if (playerSeasonalReadModel?.hasMultipleActiveAssignments) {
    return "Dieser Spieler hat mehrere aktive Zuordnungen in der aktuellen Saison. Das Speichern wird blockiert, bis der Konflikt bereinigt ist.";
  }

  return null;
}

export function getPlayerFormWarningMessageData(
  playerSeasonalReadModel,
  currentSeasonStatuses,
) {
  if (
    playerSeasonalReadModel &&
    !playerSeasonalReadModel.hasActiveAssignment &&
    playerSeasonalReadModel.activeSeasonStatus ===
      currentSeasonStatuses.RESOLVED
  ) {
    return "Dieser Spieler hat aktuell keine aktive Mannschaftszuordnung in der laufenden Saison. Die Zuordnung ist optional und kann spaeter erfolgen.";
  }

  return null;
}
