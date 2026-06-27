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

export function getPlayerNationalityStats(players = []) {
  const map = new Map();

  players.forEach((player) => {
    const country = getCountry(player.nationality);
    const key = country?.iso || "UNKNOWN";

    if (!map.has(key)) {
      map.set(key, {
        iso: key,
        label: country?.de || "Nicht hinterlegt",
        count: 0,
      });
    }

    map.get(key).count += 1;
  });

  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getPlayerStats(players = []) {
  const inactive = players.filter((player) => !player.is_active).length;
  const nationalities = getPlayerNationalityStats(players);

  return {
    total: players.length,
    inactive,
    nationalityCount: nationalities.filter((item) => item.iso !== "UNKNOWN").length,
    openContributions: 0,
    nationalities,
  };
}
