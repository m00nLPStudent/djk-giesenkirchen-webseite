export const AUTH_ENFORCEMENT_ENABLED = false;

function normalizePathname(pathname = "") {
  const cleaned = (pathname || "").split("?")[0].split("#")[0].trim();
  if (!cleaned) return "/";

  const withLeadingSlash = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, "/");

  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

function isDynamicSegment(segment = "") {
  return (
    (segment.startsWith(":") && segment.length > 1) ||
    (/^\[[^\]]+\]$/.test(segment) && segment.length > 2)
  );
}

function splitSegments(pathname = "") {
  const normalized = normalizePathname(pathname);
  if (normalized === "/") return [];
  return normalized.split("/").filter(Boolean);
}

function buildRule(
  routePattern,
  permission,
  { matchType = "prefix", priority = 100 } = {},
) {
  const normalizedPattern = normalizePathname(routePattern);

  return {
    matcher: normalizedPattern,
    routePattern: normalizedPattern,
    permission,
    matchType,
    priority,
    exact: matchType === "exact",
    segments: splitSegments(normalizedPattern),
  };
}

const ADMIN_ROUTE_PERMISSION_RULES = [
  buildRule("/admin/permissions/matrix", "permissions.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/settings/pages/new", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/settings/pages/edit/:id", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/settings/pages/:id/edit", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/news/new", "news.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/news/edit/:id", "news.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/news/:id/edit", "news.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/events/new", "events.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/events/edit/:id", "events.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/events/:id/edit", "events.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/teams/new", "teams.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/teams/edit/:id", "teams.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/teams/:id/edit", "teams.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/coaches/new", "coaches.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/coaches/edit/:id", "coaches.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/coaches/:id/edit", "coaches.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/players/new", "players.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/players/edit/:id", "players.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/players/:id/edit", "players.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/sponsors/new", "sponsors.create", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/sponsors/edit/:id", "sponsors.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/sponsors/:id/edit", "sponsors.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/department/board/new", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/department/board/edit/:id", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/department/board/:id/edit", "settings.edit", {
    matchType: "exact",
    priority: 500,
  }),
  buildRule("/admin/news", "news.view", { matchType: "prefix", priority: 300 }),
  buildRule("/admin/events", "events.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/teams", "teams.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/coaches", "coaches.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/players", "players.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/sponsors", "sponsors.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/permissions", "permissions.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/settings/pages", "settings.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/settings", "settings.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/department", "system.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/club-history", "club_history.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/users", "users.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/roles", "roles.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/profile", "dashboard.view", {
    matchType: "exact",
    priority: 300,
  }),
  buildRule("/admin/media", "system.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin/tournaments", "system.view", {
    matchType: "prefix",
    priority: 300,
  }),
  buildRule("/admin", "dashboard.view", { matchType: "exact", priority: 200 }),
];

function compareRulesBySpecificity(a, b) {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  if (a.segments.length !== b.segments.length) {
    return b.segments.length - a.segments.length;
  }

  const staticCountA = a.segments.filter(
    (segment) => !isDynamicSegment(segment),
  ).length;
  const staticCountB = b.segments.filter(
    (segment) => !isDynamicSegment(segment),
  ).length;

  if (staticCountA !== staticCountB) {
    return staticCountB - staticCountA;
  }

  return a.routePattern.localeCompare(b.routePattern);
}

export const ADMIN_ROUTE_PERMISSIONS = [...ADMIN_ROUTE_PERMISSION_RULES].sort(
  compareRulesBySpecificity,
);

function segmentMatches(patternSegment, pathnameSegment) {
  if (isDynamicSegment(patternSegment)) {
    return Boolean(pathnameSegment);
  }

  return patternSegment === pathnameSegment;
}

function matchesRouteRule(pathSegments, rule) {
  const patternSegments = rule.segments;

  if (
    rule.matchType === "exact" &&
    pathSegments.length !== patternSegments.length
  ) {
    return false;
  }

  if (
    rule.matchType === "prefix" &&
    pathSegments.length < patternSegments.length
  ) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index += 1) {
    if (!segmentMatches(patternSegments[index], pathSegments[index])) {
      return false;
    }
  }

  return true;
}

export function resolveAdminRoutePermission(pathname = "") {
  const normalizedPathname = normalizePathname(pathname);
  const pathSegments = splitSegments(normalizedPathname);

  const rule = ADMIN_ROUTE_PERMISSIONS.find((entry) =>
    matchesRouteRule(pathSegments, entry),
  );

  if (!rule) {
    return {
      matched: false,
      permission: null,
      routePattern: null,
      matchType: null,
      priority: null,
      pathname: normalizedPathname,
    };
  }

  return {
    matched: true,
    permission: rule.permission,
    routePattern: rule.routePattern,
    matchType: rule.matchType,
    priority: rule.priority,
    pathname: normalizedPathname,
  };
}

export const ADMIN_PUBLIC_ROUTE_PATTERNS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/set-password",
  "/admin/unauthorized",
];

export const ADMIN_NAV_PERMISSION_MAP = {
  "/admin": "dashboard.view",
  "/admin/news": "news.view",
  "/admin/department": "system.view",
  "/admin/sponsors": "sponsors.view",
  "/admin/teams": "teams.view",
  "/admin/coaches": "coaches.view",
  "/admin/players": "players.view",
  "/admin/media": "system.view",
  "/admin/events": "events.view",
  "/admin/club-history": "club_history.view",
  "/admin/tournaments": "system.view",
  "/admin/users": "users.view",
  "/admin/roles": "roles.view",
  "/admin/permissions": "permissions.view",
  "/admin/settings": "settings.view",
};

export const ADMIN_DASHBOARD_ACTION_PERMISSION_MAP = {
  "/admin/news/new": "news.create",
  "/admin/events/new": "events.create",
  "/admin/users": "users.view",
  "/admin/roles": "roles.view",
  "/admin/permissions": "permissions.view",
  "/admin/teams/new": "teams.create",
  "/admin/settings": "settings.view",
  "/admin/club-history": "club_history.view",
  "/admin/permissions/matrix": "permissions.edit",
};

export const ADMIN_PERMISSION_DEFAULTS = {
  allowUnknownRoute: false,
  allowUnknownNavItem: false,
  allowUnknownDashboardAction: false,
  softFailWhenDisabled: true,
};
