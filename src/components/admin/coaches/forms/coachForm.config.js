import { COUNTRIES } from "@/constants";

const germany = COUNTRIES.find((country) => country.iso === "DE");

export const COACH_COUNTRY_OPTIONS = germany
  ? [germany, ...COUNTRIES.filter((country) => country.iso !== "DE")]
  : COUNTRIES;

export const REQUIRED_COACH_FIELDS = {
  first_name: "Vorname",
  last_name: "Nachname",
  nationality: "Nationalität",
  role: "Funktion",
  email: "E-Mail",
  phone: "Telefonnummer",
  whatsapp: "WhatsApp-Nummer",
};
