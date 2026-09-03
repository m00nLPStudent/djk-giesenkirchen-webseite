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
    description: "Inhalte und zentrale Organisation des Gesamtvereins.", order: 20,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      active("news", "News", "/admin/news", "newspaper", "news.view", "permission_only", 10, "Vereinsnachrichten verwalten."),
      active("sponsors", "Sponsoren", "/admin/sponsors", "handshake", "sponsors.view", "permission_only", 20, "Sponsorenauftritte pflegen."),
      active("events", "Termine", "/admin/events", "calendar-days", "events.view", "permission_only", 30, "Termine und Veranstaltungen verwalten."),
      active("club-history", "Vereinsgeschichte", "/admin/club-history", "book-open", "club_history.view", "permission_only", 40, "Vereinsgeschichte veröffentlichen."),
      { ...active("club-board", "Vorstand Gesamtverein", "/admin/club/board", "landmark", "board.view", "permission_only", 45, "Vorstand des Gesamtvereins verwalten."), accessPolicy: "club_board" },
      active("downloads", "Downloads", "/admin/downloads", "download", "downloads.view", "permission_only", 50, "Download-Dokumente verwalten."),
      { ...active("membership-requests", "Mitgliedsanfragen", "/admin/membership-requests", "inbox", "membership_requests.view", "permission_only", 60, "Mitgliedsanfragen, Empfänger und Weiterleitungen verwalten."), accessPolicy: "membership_requests" },
      { ...active("media", "Medien", "/admin/media", "image", null, "permission_only", 70, "Zentrale Medienbibliothek für registrierte Uploads."), accessPolicy: "media_roles" },
      active("settings", "Seiten, Kontakte & Einstellungen", "/admin/settings", "settings", "settings.view", "permission_only", 80, "CMS-Seiten, Kontakte und Einstellungen."),
    ],
  },
  {
    key: "football", label: "Fußball", iconKey: "shield", href: null,
    description: "Saisonale Mannschafts- und Personenverwaltung.", order: 30,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      { ...active("teams", "Mannschaften", "/admin/football/teams", "shield", "teams.view", "team_access", 10, "Mannschaften und Saisons verwalten."), accessPolicy: "football_modules" },
      { ...active("players", "Spieler", "/admin/football/players", "users", "players.view", "team_access", 20, "Spieler und Kaderzuordnungen verwalten."), accessPolicy: "football_modules" },
      { ...active("coaches", "Trainer", "/admin/football/coaches", "user-round", "coaches.view", "staff_access", 30, "Trainer und Betreuer verwalten."), accessPolicy: "football_modules" },
      active("contributions", "Vereinsbeiträge", "/admin/contributions", "wallet", "contributions.view", "permission_only", 40, "Beiträge und Zahlungen verwalten."),
      { ...active("department", "Vorstand Fußball", "/admin/football/board", "landmark", "board.view", "board_access", 50, "Vorstand der Fußballabteilung pflegen."), accessPolicy: "football_modules" },
      planned("tournaments", "Turniere", "trophy", "team_access", 60, "Eine Adminroute ist noch nicht vorhanden."),
      planned("match-operations", "Spielbetrieb", "calendar-range", "team_access", 70, "Ein eigenes Modul ist noch nicht vorhanden."),
      planned("football-contacts", "Fußball-Ansprechpartner", "contact", "board_access", 80, "Eine fachlich eindeutige Adminroute fehlt."),
    ],
  },
  {
    key: "system", label: "System", iconKey: "activity", href: null,
    description: "Zentrale Administration und technische Überwachung des CMS.", order: 35,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      { ...active("structure-assignment", "Struktur & Zuordnung", "/admin/system/structure", "network", null, "permission_only", 5, "Organisatorische Stammdaten zentral zuordnen."), accessPolicy: "superadmin_only" },
      { ...active("users", "Benutzer", "/admin/users", "users", "users.view", "permission_only", 10, "Administrationskonten verwalten."), accessPolicy: "superadmin_only" },
      { ...active("roles", "Rollen", "/admin/roles", "key-round", "roles.view", "permission_only", 20, "Rollen verwalten."), accessPolicy: "superadmin_only" },
      { ...active("permissions", "Rechte", "/admin/permissions", "lock-keyhole", "permissions.view", "permission_only", 30, "Permission-Matrix verwalten."), accessPolicy: "superadmin_only" },
      { ...active("notification-email-settings", "E-Mail-Benachrichtigungen", "/admin/system/notification-email-settings", "mail", null, "permission_only", 40, "Globalen Notification-E-Mail-Versand steuern."), accessPolicy: "superadmin_only" },
      { ...active("notification-monitoring", "Notification Monitoring", "/admin/system/notifications", "activity", null, "permission_only", 50, "Zustellungen und Fehler der Notification-Infrastruktur überwachen."), accessPolicy: "superadmin_only" },
    ],
  },
  {
    key: "table_tennis", label: "Tischtennis", iconKey: "circle-dot", href: null,
    description: "Mannschaften und Personen der Tischtennisabteilung.", order: 40,
    visibility: { strategy: "visible_items" }, implementationStatus: "active",
    items: [
      { ...active("table-tennis-teams", "Mannschaften", "/admin/table-tennis/teams", "circle-dot", "teams.view", "team_access", 10, "Tischtennis-Mannschaften und Saisons verwalten."), accessPolicy: "table_tennis" },
      { ...active("table-tennis-players", "Spieler & Kader", "/admin/table-tennis/players", "users", "players.view", "team_access", 20, "Tischtennis-Spieler und Kaderzuordnungen verwalten."), accessPolicy: "table_tennis" },
      { ...active("table-tennis-coaches", "Trainer", "/admin/table-tennis/coaches", "user-round", "coaches.view", "staff_access", 30, "Tischtennis-Trainer verwalten."), accessPolicy: "table_tennis" },
      { ...active("table-tennis-board", "Vorstand Tischtennis", "/admin/table-tennis/board", "landmark", "board.view", "board_access", 40, "Vorstand der Tischtennisabteilung verwalten."), accessPolicy: "table_tennis" },
    ],
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
