const SPORT_BY_DEPARTMENT = Object.freeze({
  fussball: "football",
  football: "football",
  tischtennis: "table-tennis",
  "table-tennis": "table-tennis",
  gymnastikdamen: "gymnastics",
  "damen-gymnastik": "gymnastics",
  behindertensport: "inclusive-sports",
});

export function resolveTrainingSport(event = {}) {
  const explicitSport = typeof event.sport_key === "string" ? event.sport_key.trim().toLowerCase() : "";
  if (["football", "table-tennis", "gymnastics", "inclusive-sports"].includes(explicitSport)) return explicitSport;

  const departmentSlug = typeof event.department_slug === "string" ? event.department_slug.trim().toLowerCase() : "";
  return SPORT_BY_DEPARTMENT[departmentSlug] || "unknown";
}
