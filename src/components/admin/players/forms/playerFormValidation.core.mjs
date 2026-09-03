export const REQUIRED_FOOTBALL_PLAYER_FIELDS = {
  first_name: "Vorname",
  last_name: "Nachname",
  birthdate: "Geburtsdatum",
  nationality: "Nationalität",
  gender: "Geschlecht",
};

export const REQUIRED_TABLE_TENNIS_PLAYER_FIELDS = {
  first_name: "Vorname",
  last_name: "Nachname",
  birthdate: "Geburtsdatum",
  strong_hand: "Starke Hand",
  nationality: "Nationalität",
  gender: "Geschlecht",
};

export function validatePlayerRequiredFields(form = {}, sportContext = "football") {
  const requiredFields = sportContext === "table_tennis"
    ? REQUIRED_TABLE_TENNIS_PLAYER_FIELDS
    : REQUIRED_FOOTBALL_PLAYER_FIELDS;

  return Object.fromEntries(
    Object.entries(requiredFields)
      .filter(([field]) => !String(form[field] || "").trim())
      .map(([field, label]) => [field, `${label} ist ein Pflichtfeld.`]),
  );
}
