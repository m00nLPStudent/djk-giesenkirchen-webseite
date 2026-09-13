const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const PUBLIC_SITEMAP_PATHS = Object.freeze([
  "/",
  "/anfahrt",
  "/behindertensport",
  "/cookie-einstellungen",
  "/damen-gymnastik",
  "/datenschutz",
  "/downloads",
  "/fussball",
  "/fussball/abteilung",
  "/fussball/abteilung/trainer",
  "/fussball/abteilung/vorstand",
  "/fussball/mannschaften",
  "/fussball/spielplan-tabelle",
  "/fussball/sponsoren",
  "/fussball/trainingszeiten",
  "/impressum",
  "/kontakt",
  "/mitglied-werden",
  "/news",
  "/news/uebersicht",
  "/termine",
  "/termine/allgemein",
  "/termine/training",
  "/tischtennis",
  "/tischtennis/mannschaften",
  "/tischtennis/spielplan-tabelle",
  "/tischtennis/trainingszeiten",
  "/tischtennis/vorstand",
  "/verein",
  "/verein/vereinsgeschichte",
  "/verein/vorstand",
]);

export function normalizePublicSiteUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const isLocalHttp = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
    if (url.protocol !== "https:" && !isLocalHttp) return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolvePublicSeoConfig(env = process.env) {
  const siteUrl = normalizePublicSiteUrl(env.NEXT_PUBLIC_SITE_URL);
  const indexingEnabled = env.PUBLIC_SITE_INDEXING_ENABLED === "true" && Boolean(siteUrl) && siteUrl.startsWith("https://");
  return { siteUrl, indexingEnabled };
}

export function buildPublicRobots(env = process.env) {
  const { siteUrl, indexingEnabled } = resolvePublicSeoConfig(env);
  if (!indexingEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/auth/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

export function buildPublicSitemap(env = process.env) {
  const { siteUrl, indexingEnabled } = resolvePublicSeoConfig(env);
  if (!indexingEnabled) return [];
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
