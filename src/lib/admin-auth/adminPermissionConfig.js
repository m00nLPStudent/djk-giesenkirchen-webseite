export const AUTH_ENFORCEMENT_ENABLED = false;

export const ADMIN_ROUTE_PERMISSIONS = [
  { matcher: "/admin", permission: "dashboard.view", exact: true },
  { matcher: "/admin/news", permission: "news.view" },
  { matcher: "/admin/news/new", permission: "news.create" },
  { matcher: "/admin/events", permission: "events.view" },
  { matcher: "/admin/teams", permission: "teams.view" },
  { matcher: "/admin/coaches", permission: "coaches.view" },
  { matcher: "/admin/players", permission: "players.view" },
  { matcher: "/admin/users", permission: "users.view" },
  { matcher: "/admin/roles", permission: "roles.view" },
  { matcher: "/admin/permissions", permission: "system.view" },
  { matcher: "/admin/settings", permission: "settings.view" },
  { matcher: "/admin/department", permission: "system.view" },
  { matcher: "/admin/club-history", permission: "club_history.view" },
  { matcher: "/admin/sponsors", permission: "sponsors.view" },
  { matcher: "/admin/media", permission: "system.view" },
  { matcher: "/admin/tournaments", permission: "system.view" },
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
  "/admin/permissions": "system.view",
  "/admin/settings": "settings.view",
};

export const ADMIN_DASHBOARD_ACTION_PERMISSION_MAP = {
  "/admin/news/new": "news.create",
  "/admin/events/new": "events.create",
  "/admin/users": "users.view",
  "/admin/roles": "roles.view",
  "/admin/permissions": "system.view",
  "/admin/teams/new": "teams.create",
  "/admin/settings": "settings.view",
  "/admin/club-history": "club_history.view",
};

export const ADMIN_PERMISSION_DEFAULTS = {
  allowUnknownRoute: true,
  allowUnknownNavItem: true,
  allowUnknownDashboardAction: true,
  softFailWhenDisabled: true,
};
