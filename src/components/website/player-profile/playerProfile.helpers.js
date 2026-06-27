import { COUNTRIES } from "@/constants";

export function getCountry(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    COUNTRIES.find((country) => {
      return (
        country.iso.toLowerCase() === normalizedValue ||
        country.de.toLowerCase() === normalizedValue ||
        country.en.toLowerCase() === normalizedValue
      );
    }) || null
  );
}

export function getTeam(player) {
  if (Array.isArray(player?.teams)) return player.teams[0] || null;
  return player?.teams || null;
}

export function calculateAge(birthdate) {
  if (!birthdate) return null;

  const birthday = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age = age - 1;
  }

  return age;
}

export function formatDate(date) {
  if (!date) return "Nicht hinterlegt";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getFullName(player) {
  return `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();
}
