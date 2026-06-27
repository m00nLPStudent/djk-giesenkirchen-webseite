import {
  ADVANCED_POSITIONS,
  COUNTRIES,
  SIMPLE_POSITIONS,
} from "@/constants";

export const POSITION_EN = {
  Torwart: "Goalkeeper",
  Abwehr: "Defence",
  Mittelfeld: "Midfield",
  Angriff: "Attack",
  Innenverteidiger: "Centre-back",
  Außenverteidiger: "Full-back",
  "Defensives Mittelfeld": "Defensive midfield",
  "Zentrales Mittelfeld": "Central midfield",
  "Offensives Mittelfeld": "Central midfield",
  "Linkes Mittelfeld": "Left midfield",
  "Rechtes Mittelfeld": "Right midfield",
  Linksaußen: "Left winger",
  Rechtsaußen: "Right winger",
  Mittelstürmer: "Centre forward",
};

export const REQUIRED_PLAYER_FIELDS = {
  team_id: "Mannschaft",
  first_name: "Vorname",
  last_name: "Nachname",
  birthdate: "Geburtsdatum",
  position_de: "Position",
  nationality: "Nationalität",
  gender: "Geschlecht",
};

const germany = COUNTRIES.find((country) => country.iso === "DE");

export const COUNTRY_OPTIONS = germany
  ? [germany, ...COUNTRIES.filter((country) => country.iso !== "DE")]
  : COUNTRIES;

export function usesSimplePositions(teamName = "") {
  const name = teamName.toLowerCase();

  return (
    name.includes("bambini") ||
    name.includes("f-jugend") ||
    name.includes("f1") ||
    name.includes("f2") ||
    name.includes("e-jugend") ||
    name.includes("e1") ||
    name.includes("e2")
  );
}

export function getPositionOptions(teamName = "") {
  return usesSimplePositions(teamName) ? SIMPLE_POSITIONS : ADVANCED_POSITIONS;
}
