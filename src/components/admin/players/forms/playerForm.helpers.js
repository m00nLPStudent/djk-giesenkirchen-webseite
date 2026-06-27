import { PLAYER_PLACEHOLDER_IMAGE } from "../services/players.service";
import { REQUIRED_PLAYER_FIELDS } from "./playerForm.config";

export function createInitialPlayerForm(player) {
  return {
    team_id: player?.team_id || "",
    first_name: player?.first_name || "",
    last_name: player?.last_name || "",
    shirt_number: player?.shirt_number || "",
    position_de: player?.position_de || "",
    position_en: player?.position_en || "",
    photo_url: player?.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    description_de: player?.description_de || "",
    description_en: player?.description_en || "",
    birthdate: player?.birthdate || "",
    joined_at: player?.joined_at || "",
    strong_foot: player?.strong_foot || "",
    nationality: player?.nationality || "",
    gender: player?.gender || "",
    sort_order: player?.sort_order || 0,
    is_active: player?.is_active ?? true,
    is_captain: player?.is_captain ?? false,
  };
}

export function getYearGroupFromBirthdate(birthdate) {
  if (!birthdate) return "";
  return String(new Date(birthdate).getFullYear());
}

export function validatePlayerForm(form) {
  const errors = {};

  Object.entries(REQUIRED_PLAYER_FIELDS).forEach(([field, label]) => {
    if (!String(form[field] || "").trim()) {
      errors[field] = `${label} ist ein Pflichtfeld.`;
    }
  });

  return errors;
}

export function createPlayerPayload(form, yearGroup) {
  return {
    ...form,
    photo_url: form.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    year_group: yearGroup,
  };
}
