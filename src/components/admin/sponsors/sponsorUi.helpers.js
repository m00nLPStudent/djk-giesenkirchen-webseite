export function getSponsorStatus(sponsor = {}) {
  return sponsor.is_active === false
    ? { label: "Inaktiv", variant: "warning" }
    : { label: "Aktiv", variant: "success" };
}

export function getSafeSponsorWebsiteUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function filterSponsors(sponsors = [], { search = "", status = "all" } = {}) {
  const query = String(search).trim().toLocaleLowerCase("de-DE");
  return sponsors.filter((sponsor) => {
    if (status === "active" && sponsor.is_active === false) return false;
    if (status === "inactive" && sponsor.is_active !== false) return false;
    if (!query) return true;
    return [sponsor.name, sponsor.sponsor_categories?.name_de, sponsor.website_url, sponsor.description_de]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("de-DE").includes(query));
  });
}

export function getSponsorSummary(sponsors = []) {
  return {
    total: sponsors.length,
    active: sponsors.filter((sponsor) => sponsor.is_active !== false).length,
    inactive: sponsors.filter((sponsor) => sponsor.is_active === false).length,
    withoutLogo: sponsors.filter((sponsor) => !String(sponsor.image_url || "").trim()).length,
  };
}
