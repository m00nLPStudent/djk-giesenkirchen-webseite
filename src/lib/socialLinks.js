export const SOCIAL_LINK_KEYS = ["facebook", "instagram", "youtube", "tiktok", "linkedin", "x"];

export function normalizeExternalHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function resolveSocialLinks(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(SOCIAL_LINK_KEYS.flatMap((key) => {
    const href = normalizeExternalHttpUrl(value[key]);
    return href ? [[key, href]] : [];
  }));
}

export function selectMobileHeaderSocialLinks(links = {}) {
  return Object.fromEntries(
    ["instagram", "facebook"].flatMap((key) => links[key] ? [[key, links[key]]] : []),
  );
}
