import { canSeeDashboardAction } from "@/lib/admin-auth/permissionEngine";

export const DASHBOARD_QUICK_ACTIONS = [
  {
    label: "Neue News",
    href: "/admin/news/new",
    tone: "primary",
    requiredPermission: "news.create",
  },
  {
    label: "Neuer Termin",
    href: "/admin/events/new",
    tone: "neutral",
    requiredPermission: "events.create",
  },
  {
    label: "Benutzer",
    href: "/admin/users",
    tone: "neutral",
    requiredPermission: "users.view",
  },
  {
    label: "Rollen",
    href: "/admin/roles",
    tone: "neutral",
    requiredPermission: "roles.view",
  },
  {
    label: "Rechte",
    href: "/admin/permissions",
    tone: "neutral",
    requiredPermission: "system.view",
  },
  {
    label: "Neue Mannschaft",
    href: "/admin/teams/new",
    tone: "neutral",
    requiredPermission: "teams.create",
  },
  {
    label: "Einstellungen",
    href: "/admin/settings",
    tone: "neutral",
    requiredPermission: "settings.view",
  },
  {
    label: "Mitgliedsanfragen",
    href: "/admin/settings",
    tone: "neutral",
    requiredPermission: "settings.view",
  },
  {
    label: "Vereinsgeschichte",
    href: "/admin/club-history",
    tone: "neutral",
    requiredPermission: "club_history.view",
  },
];

export function getVisibleDashboardQuickActions(userContext) {
  return DASHBOARD_QUICK_ACTIONS.filter((action) =>
    canSeeDashboardAction(userContext, action),
  );
}

export const DASHBOARD_STAT_ITEMS = [
  { key: "newsTotal", label: "News gesamt", href: "/admin/news" },
  { key: "newsPublished", label: "News veröffentlicht", href: "/admin/news" },
  {
    key: "newsPlannedOrDraft",
    label: "News Entwürfe/Geplant",
    href: "/admin/news",
  },
  { key: "teamsTotal", label: "Mannschaften", href: "/admin/teams" },
  { key: "coachesTotal", label: "Trainer", href: "/admin/coaches" },
  { key: "sponsorsTotal", label: "Sponsoren", href: "/admin/sponsors" },
  { key: "eventsTotal", label: "Termine", href: "/admin/events" },
  {
    key: "membershipOpenTotal",
    label: "Mitgliedsanfragen offen",
    href: "/admin/settings",
  },
];
