export const CATEGORY_GROUPS = {
  news: { table: "news_categories", title: "News-Kategorien", singular: "News-Kategorie" },
  events: { table: "event_types", title: "Terminarten", singular: "Terminart" },
  downloads: { table: "download_categories", title: "Download-Kategorien", singular: "Download-Kategorie" },
};

export function normalizeCategoryPayload(value = {}) {
  return { name_de: String(value.name_de || "").trim(), name_en: String(value.name_en || "").trim() || null, slug: String(value.slug || "").trim().toLowerCase(), is_active: value.is_active !== false, sort_order: Number(value.sort_order || 0) };
}

export function filterCategories(items = [], status = "all") {
  return [...items].filter((item) => status === "all" || (status === "active" ? item.is_active !== false : item.is_active === false)).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function categorySummary(items = []) {
  return { total: items.length, active: items.filter((item) => item.is_active !== false).length, inactive: items.filter((item) => item.is_active === false).length };
}
