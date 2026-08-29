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

export function normalizeGoogleMapsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const hostname = url.hostname.toLowerCase();
    const isGoogleHost = hostname === "google.com" || hostname.endsWith(".google.com");
    const isMapsHost = hostname === "maps.app.goo.gl";
    if (url.protocol !== "https:" || (!isGoogleHost && !isMapsHost)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isGoogleMapsEmbedUrl(value) {
  const normalized = normalizeGoogleMapsUrl(value);
  if (!normalized) return false;
  const url = new URL(normalized);
  return url.hostname.endsWith(".google.com") && url.pathname.startsWith("/maps/embed");
}

export function buildGoogleMapsEmbedUrl({ apiKey, query } = {}) {
  const normalizedKey = String(apiKey || "").trim();
  const normalizedQuery = String(query || "").trim();
  if (!/^AIza[\w-]{35}$/.test(normalizedKey) || !normalizedQuery || normalizedQuery.length > 500) return null;

  const url = new URL("https://www.google.com/maps/embed/v1/place");
  url.searchParams.set("key", normalizedKey);
  url.searchParams.set("q", normalizedQuery);
  return url.toString();
}
