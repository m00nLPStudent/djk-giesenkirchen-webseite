const definitions = [
  ["player_assigned","team","Spieler hinzugefügt","Ein Spieler wurde deinem Kader hinzugefügt.",false],
  ["player_removed","team","Spieler entfernt","Ein Spieler wurde aus deinem Kader entfernt.",false],
  ["player_updated","team","Spielerzuordnung geändert","Eine saisonale Spielerzuordnung wurde geändert.",false],
  ["trainer_assigned","team","Mannschaftszuordnung erhalten","Du wurdest einer Mannschaft zugeordnet.",true],
  ["trainer_removed","team","Mannschaftszuordnung beendet","Deine Mannschaftszuordnung wurde beendet.",true],
  ["trainer_changed","team","Trainerfunktion geändert","Deine Funktion in einer Mannschaft wurde geändert.",true],
  ["team_changed","team","Mannschaft geändert","Eine für dich relevante Mannschaft wurde geändert.",false],
  ["membership_created","membership","Neue Mitgliedsanfrage","Eine neue Mitgliedsanfrage ist eingegangen.",false],
  ["membership_assigned","membership","Mitgliedsanfrage zugewiesen","Eine Anfrage wurde dir persönlich zugewiesen.",true],
  ["membership_forwarded","membership","Mitgliedsanfrage weitergeleitet","Eine Anfrage wurde an dich weitergeleitet.",true],
  ["membership_processing","membership","Anfrage in Bearbeitung","Der Bearbeitungsstatus einer Anfrage wurde geändert.",false],
  ["membership_completed","membership","Persönliche Rückmeldung","Eine von dir betreute Anfrage wurde erledigt.",true],
  ["membership_accepted","membership","Mitgliedsanfrage angenommen","Eine Anfrage wurde angenommen.",false],
  ["membership_rejected","membership","Mitgliedsanfrage abgelehnt","Eine Anfrage wurde abgelehnt.",false],
  ["membership_archived","membership","Mitgliedsanfrage archiviert","Eine Anfrage wurde archiviert.",false],
  ["membership_payment_created","contributions","Vereinsbeitrag angelegt","Ein relevanter Vereinsbeitrag wurde angelegt.",false],
  ["membership_payment_updated","contributions","Vereinsbeitrag geändert","Ein relevanter Vereinsbeitrag wurde geändert.",false],
  ["membership_payment_received","contributions","Zahlung erfasst","Eine Zahlung wurde erfasst.",false],
  ["membership_payment_confirmed","contributions","Zahlung bestätigt","Eine Zahlung wurde bestätigt.",false],
  ["membership_payment_overdue","contributions","Zahlung überfällig","Eine Beitragszahlung ist überfällig.",false],
  ["membership_payment_deleted","contributions","Zahlung storniert","Eine Zahlung wurde storniert.",false],
  ["member_activated","contributions","Mitglied aktiviert","Ein Mitglied wurde aktiviert.",false],
  ["member_deactivated","contributions","Mitglied deaktiviert","Ein Mitglied wurde deaktiviert.",false],
  ["member_archived","contributions","Mitglied archiviert","Ein Mitglied wurde archiviert.",false],
  ["event_created","events","Termin oder Trainingszeit erstellt","Ein Mannschaftstermin oder eine Trainingszeit wurde erstellt.",false],
  ["event_updated","events","Termin oder Training geändert","Ein Termin, eine Trainingszeit oder Ausnahme wurde geändert.",false],
  ["event_cancelled","events","Termin oder Training abgesagt","Ein Termin oder Training wurde abgesagt oder entfernt.",false],
  ["system_information","system","Wichtige Systeminformation","Eine technisch oder sicherheitsrelevante Information.",true],
].map(([type,group,label,description,mandatory]) => ({ type, group, label, description, mandatory, configurable: !mandatory, defaultEnabled: true }));

export const notificationPreferenceDefinitions = Object.freeze(definitions);
export const notificationPreferenceGroups = Object.freeze([
  { key:"team", label:"Spieler & Mannschaft" }, { key:"membership", label:"Mitgliedschaft" },
  { key:"contributions", label:"Beiträge" }, { key:"events", label:"Termine & Training" },
  { key:"editorial", label:"Redaktion" }, { key:"system", label:"System" },
]);
const byType = new Map(definitions.map((item) => [item.type, item]));
export const getNotificationPreferenceDefinition = (type) => byType.get(String(type || "")) || null;
export const getNotificationPreferenceGroup = (type) => getNotificationPreferenceDefinition(type)?.group || null;
export const isNotificationTypeMandatory = (type) => getNotificationPreferenceDefinition(type)?.mandatory === true;
export const isNotificationTypeConfigurable = (type) => getNotificationPreferenceDefinition(type)?.configurable === true;
export const getOptionalNotificationTypes = () => definitions.filter((item) => item.configurable).map((item) => item.type);
export const isNotificationEnabled = (type, storedValue) => !getNotificationPreferenceDefinition(type) || isNotificationTypeMandatory(type) || storedValue !== false;
