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
  if (
    teamOptionsResult?.activeSeasonStatus === currentSeasonStatuses.MISSING
  ) {
    return "Es ist keine aktuelle Saison markiert. Das Spielerformular kann derzeit keine gueltige Mannschaftszuordnung speichern.";
  }

  if (
    teamOptionsResult?.activeSeasonStatus === currentSeasonStatuses.AMBIGUOUS
  ) {
    return "Es sind mehrere aktuelle Saisons markiert. Bitte bereinige die Saisonkonfiguration, bevor Spieler gespeichert werden.";
  }

  if (playerSeasonalReadModel?.hasMultipleActiveAssignments) {
    return "Dieser Spieler hat mehrere aktive Zuordnungen in der aktuellen Saison. Das Speichern wird blockiert, bis der Konflikt bereinigt ist.";
  }

  if (
    teamOptionsResult?.activeSeasonStatus === currentSeasonStatuses.RESOLVED &&
    (teamOptionsResult?.teamOptions || []).length === 0
  ) {
    return "Es stehen in der aktuellen Saison keine aktiven Mannschaften innerhalb deines Scopes zur Verfuegung.";
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
    return "Dieser Spieler hat aktuell keine aktive Mannschaftszuordnung in der laufenden Saison. Bitte waehle die gewuenschte Mannschaft bewusst aus.";
  }

  return null;
}
