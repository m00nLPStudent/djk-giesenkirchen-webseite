export const NAVIGATION_FEATURE_STATUSES = Object.freeze([
  "active",
  "planned",
  "hidden",
  "blocked",
]);

const active = (key, label, href, iconKey, permissionKey, scopeType, order, description) => ({
  key, label, href, iconKey, permissionKey, scopeType, order, description,
  writePermissionKeys: permissionKey?.endsWith(".view") && permissionKey !== "dashboard.view"
    ? [permissionKey.replace(/\.view$/, ".edit")]
    : [],
  exactMatch: href === "/admin",
  matchPrefixes: href === "/admin" ? [] : [href],
  implementationStatus: "active",
  isExternal: false,
});

const planned = (key, label, iconKey, scopeType, order, description) => ({
  key, label, href: null, iconKey, permissionKey: null, permissionKeys: [],
  scopeType, order, description, exactMatch: false, matchPrefixes: [],
  implementationStatus: "planned", isExternal: false,
});

export const ADMIN_NAVIGATION_SECTIONS = [
  {
    key: "overview", label: "Übersicht", iconKey: "layout-dashboard", href: "/admin",
    description: "Persönlicher Einstieg in das CMS.", order: 10,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [active("dashboard", "Übersicht", "/admin", "layout-dashboard", "dashboard.view", "permission_only", 10, "Aufgaben und relevante Vereinsinformationen.")],
  },
  {
    key: "club", label: "Gesamtverein", iconKey: "building-2", href: null,
    description: "Inhalte, Organisation und Administration des Vereins.", order: 20,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      active("news", "News", "/admin/news", "newspaper", "news.view", "permission_only", 10, "Vereinsnachrichten verwalten."),
      active("events", "Termine", "/admin/events", "calendar-days", "events.view", "permission_only", 20, "Termine und Veranstaltungen verwalten."),
      active("sponsors", "Sponsoren", "/admin/sponsors", "handshake", "sponsors.view", "permission_only", 30, "Sponsorenauftritte pflegen."),
      active("club-history", "Vereinsgeschichte", "/admin/club-history", "book-open", "club_history.view", "permission_only", 40, "Vereinsgeschichte veröffentlichen."),
      active("department", "Vereinsstruktur", "/admin/department", "landmark", "settings.view", "board_access", 50, "Vorstand und Ansprechpartner pflegen."),
      active("settings", "Seiten, Kontakte & Einstellungen", "/admin/settings", "settings", "settings.view", "permission_only", 60, "CMS-Seiten, Kontakte und Einstellungen."),
      active("users", "Benutzer", "/admin/users", "users", "users.view", "permission_only", 70, "Administrationskonten verwalten."),
      active("roles", "Rollen", "/admin/roles", "key-round", "roles.view", "permission_only", 80, "Rollen verwalten."),
      active("permissions", "Rechte", "/admin/permissions", "lock-keyhole", "permissions.view", "permission_only", 90, "Permission-Matrix verwalten."),
      { ...active("membership-requests", "Mitgliedsanfragen", "/admin/membership-requests", "inbox", "membership_requests.view", "permission_only", 55, "Mitgliedsanfragen, Empfänger und Weiterleitungen verwalten."), accessPolicy: "membership_requests" },
      planned("media", "Medien", "image", "permission_only", 110, "Eine Adminroute ist noch nicht vorhanden."),
    ],
  },
  {
    key: "football", label: "Fußball", iconKey: "shield", href: null,
    description: "Saisonale Mannschafts- und Personenverwaltung.", order: 30,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      active("teams", "Mannschaften", "/admin/teams", "shield", "teams.view", "team_access", 10, "Mannschaften und Saisons verwalten."),
      active("players", "Spieler", "/admin/players", "users", "players.view", "team_access", 20, "Spieler und Kaderzuordnungen verwalten."),
      active("coaches", "Trainer", "/admin/coaches", "user-round", "coaches.view", "staff_access", 30, "Trainer und Betreuer verwalten."),
      active("contributions", "Vereinsbeiträge", "/admin/contributions", "wallet", "contributions.view", "permission_only", 40, "Beiträge und Zahlungen verwalten."),
      planned("tournaments", "Turniere", "trophy", "team_access", 50, "Eine Adminroute ist noch nicht vorhanden."),
      planned("match-operations", "Spielbetrieb", "calendar-range", "team_access", 60, "Ein eigenes Modul ist noch nicht vorhanden."),
      planned("football-contacts", "Fußball-Ansprechpartner", "contact", "board_access", 70, "Eine fachlich eindeutige Adminroute fehlt."),
    ],
  },
  {
    key: "system", label: "System", iconKey: "activity", href: null,
    description: "Technische Überwachung des CMS.", order: 35,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [{ ...active("notification-monitoring", "Notification Monitoring", "/admin/system/notifications", "activity", null, "permission_only", 10, "Zustellungen und Fehler der Notification-Infrastruktur überwachen."), accessPolicy: "superadmin_only" }],
  },
  {
    key: "table_tennis", label: "Tischtennis", iconKey: "circle-dot", href: null,
    description: "Geplanter Verwaltungsbereich für Tischtennis.", order: 40,
    visibility: { strategy: "visible_items" }, implementationStatus: "planned",
    items: ["Übersicht", "Mannschaften", "Spieler", "Verantwortliche", "Turniere", "Training", "Tabellen", "Spielpläne", "Medien"].map((label, index) => planned(`table-tennis-${index}`, label, "circle-dot", "department_unavailable", (index + 1) * 10, "Department-Scope und Adminroute fehlen.")),
  },
  {
    key: "disabled_sports", label: "Behindertensport", iconKey: "heart-handshake", href: null,
    description: "Geplanter kompakter Inhaltsbereich.", order: 50,
    visibility: { strategy: "visible_items" }, implementationStatus: "planned",
    items: ["Übersicht", "Inhalte", "Trainingszeiten", "Ansprechpartner", "Bilder"].map((label, index) => planned(`disabled-sports-${index}`, label, "heart-handshake", "department_unavailable", (index + 1) * 10, "Department-Content-Scope fehlt.")),
  },
  {
    key: "gymnastics", label: "Gymnastikdamen", iconKey: "activity", href: null,
    description: "Geplanter kompakter Inhaltsbereich.", order: 60,
    visibility: { strategy: "visible_items" }, implementationStatus: "planned",
    items: ["Übersicht", "Inhalte", "Trainingszeiten", "Ansprechpartner", "Bilder"].map((label, index) => planned(`gymnastics-${index}`, label, "activity", "department_unavailable", (index + 1) * 10, "Department-Content-Scope fehlt.")),
  },
];
