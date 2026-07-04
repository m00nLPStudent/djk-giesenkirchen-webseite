export function buildGoogleMapsSearchUrl({
  locationName,
  locationAddress,
  locationCity,
} = {}) {
  const query = [locationName, locationAddress, locationCity]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(", ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
