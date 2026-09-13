const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEPARTMENT_ROUTES = Object.freeze({
  behindertensport: "/behindertensport",
  "damen-gymnastik": "/damen-gymnastik",
  fussball: "/fussball",
  tischtennis: "/tischtennis",
});

function normalizedSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return SAFE_SLUG.test(slug) ? slug : null;
}

function normalizedTeamPathSegment(value) {
  const segment = typeof value === "string" ? value.trim() : "";
  if (!segment || segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
    return null;
  }
  return encodeURIComponent(segment);
}

export function selectTeamTrainingForDepartment(events = [], departmentSlug) {
  const expectedSlug = normalizedSlug(departmentSlug);
  if (!expectedSlug) return [];

  return (events || []).filter(
    (event) =>
      event?.source_type === "team_training" &&
      event?.team_id &&
      normalizedSlug(event.department_slug) === expectedSlug,
  );
}

export function resolveTrainingOwnerLink(event = {}) {
  const departmentSlug = normalizedSlug(event.department_slug);

  if (event.source_type === "department_training") {
    const expectedHref = departmentSlug ? DEPARTMENT_ROUTES[departmentSlug] : null;
    return expectedHref
      ? { href: expectedHref, label: "Zum Bereich", kind: "department" }
      : null;
  }

  if (event.source_type !== "team_training" || !event.team_id) return null;
  const teamPathSegment = normalizedTeamPathSegment(event.team_slug);
  if (!teamPathSegment) return null;

  if (departmentSlug === "fussball") {
    return { href: `/fussball/${teamPathSegment}`, label: "Zur Mannschaft", kind: "team" };
  }
  if (departmentSlug === "tischtennis") {
    return {
      href: `/tischtennis/mannschaften/${teamPathSegment}`,
      label: "Zur Mannschaft",
      kind: "team",
    };
  }

  return null;
}
