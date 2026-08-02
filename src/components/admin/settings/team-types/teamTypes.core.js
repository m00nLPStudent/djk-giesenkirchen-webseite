const text = (value) => String(value || "").trim();

export function createTeamTypeForm(item = null) {
  return { name_de: item?.name_de || "", slug: item?.slug || "", age_group: item?.age_group || "", sort_order: item?.sort_order ?? 0, is_active: item?.is_active ?? true };
}

export function normalizeTeamTypePayload(form = {}) {
  return { name_de: text(form.name_de), slug: text(form.slug).toLowerCase(), age_group: text(form.age_group), sort_order: Number(form.sort_order || 0), is_active: Boolean(form.is_active) };
}

export function sortTeamTypes(items = []) {
  return [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

export function filterTeamTypes(items = [], status = "all") {
  if (status === "active") return items.filter((item) => item.is_active !== false);
  if (status === "inactive") return items.filter((item) => item.is_active === false);
  return items;
}

export function isTeamTypeUsed(template = {}, teams = []) {
  const slug = text(template.slug).toLowerCase();
  const name = text(template.name_de).toLowerCase();
  return teams.some((team) => (slug && text(team.slug).toLowerCase() === slug) || (name && text(team.name_de).toLowerCase() === name));
}

export function getTeamTypeMutationErrorMessage() {
  return "Die Mannschaftsvorlage konnte nicht gespeichert werden. Dir fehlt m\u00f6glicherweise die erforderliche Berechtigung.";
}
