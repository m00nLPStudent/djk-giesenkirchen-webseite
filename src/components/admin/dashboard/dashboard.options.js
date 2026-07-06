export const DASHBOARD_QUICK_ACTIONS = [
  { label: "Neue News", href: "/admin/news/new", tone: "primary" },
  { label: "Neuer Termin", href: "/admin/events/new", tone: "neutral" },
  { label: "Benutzer", href: "/admin/users", tone: "neutral" },
  { label: "Rollen", href: "/admin/roles", tone: "neutral" },
  { label: "Neue Mannschaft", href: "/admin/teams/new", tone: "neutral" },
  { label: "Einstellungen", href: "/admin/settings", tone: "neutral" },
  { label: "Mitgliedsanfragen", href: "/admin/settings", tone: "neutral" },
  { label: "Vereinsgeschichte", href: "/admin/club-history", tone: "neutral" },
];

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
