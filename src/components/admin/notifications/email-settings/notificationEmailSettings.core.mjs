const definitions = [
  ["membership_created", "membership", "Neue Mitgliedsanfrage", "Eine neue relevante Mitgliedsanfrage ist eingegangen.", true],
  ["membership_assigned", "membership", "Mitgliedsanfrage zugewiesen", "Eine Mitgliedsanfrage wurde persönlich zugewiesen.", true],
  ["membership_forwarded", "membership", "Mitgliedsanfrage weitergeleitet", "Eine Mitgliedsanfrage wurde weitergeleitet.", true],
  ["membership_processing", "membership", "Mitgliedsanfrage in Bearbeitung", "Der Bearbeitungsstatus einer Mitgliedsanfrage wurde geändert.", true],
  ["membership_completed", "membership", "Mitgliedsanfrage abgeschlossen", "Eine relevante Mitgliedsanfrage wurde abgeschlossen.", true],
  ["player_assigned", "team", "Spieler zur Mannschaft hinzugefügt", "Einer Mannschaft wurde ein Spieler zugeordnet.", true],
  ["player_removed", "team", "Spieler aus Mannschaft entfernt", "Eine Spielerzuordnung wurde beendet.", false],
  ["player_updated", "team", "Spielerzuordnung geändert", "Eine saisonale Spielerzuordnung wurde geändert.", false],
  ["team_changed", "team", "Mannschaft geändert", "Eine relevante Mannschaft wurde geändert.", true],
  ["trainer_assigned", "trainer", "Trainerzuordnung erhalten", "Eine Trainer- oder Betreuerzuordnung wurde angelegt.", true],
  ["trainer_removed", "trainer", "Trainerzuordnung beendet", "Eine Trainer- oder Betreuerzuordnung wurde beendet.", true],
  ["trainer_changed", "trainer", "Trainerfunktion geändert", "Eine Trainer- oder Betreuerfunktion wurde geändert.", true],
  ["membership_payment_created", "contributions", "Vereinsbeitrag angelegt", "Eine neue Beitragsinformation wurde angelegt.", false],
  ["membership_payment_updated", "contributions", "Vereinsbeitrag geändert", "Eine Beitragsinformation wurde geändert.", false],
  ["membership_payment_received", "contributions", "Zahlung erfasst", "Eine Beitragszahlung wurde erfasst.", false],
  ["membership_payment_deleted", "contributions", "Zahlung storniert", "Eine Beitragszahlung wurde storniert.", false],
  ["membership_payment_due_soon", "contributions", "Beitrag bald fällig", "Eine Beitragsfälligkeit steht bevor.", false],
  ["membership_payment_due_today", "contributions", "Beitrag heute fällig", "Ein Vereinsbeitrag ist heute fällig.", false],
  ["membership_payment_overdue", "contributions", "Beitrag überfällig", "Eine überfällige Beitragsinformation liegt vor.", true],
  ["membership_payment_partial_open", "contributions", "Offener Restbetrag", "Zu einem Vereinsbeitrag besteht ein offener Restbetrag.", true],
  ["membership_payment_deferral_ending", "contributions", "Stundung endet", "Eine Beitragsstundung erreicht ihr Enddatum.", false],
  ["member_activated", "members", "Mitglied aktiviert", "Ein relevantes Mitglied wurde aktiviert.", true],
  ["member_deactivated", "members", "Mitglied deaktiviert", "Ein relevantes Mitglied wurde deaktiviert.", true],
  ["member_archived", "members", "Mitglied archiviert", "Ein relevantes Mitglied wurde archiviert.", true],
  ["event_created", "events", "Termin erstellt", "Ein relevanter Termin oder eine Trainingszeit wurde erstellt.", false],
  ["event_updated", "events", "Termin geändert", "Ein relevanter Termin oder eine Trainingsinformation wurde geändert.", true],
  ["event_cancelled", "events", "Termin abgesagt oder entfernt", "Ein Termin oder eine Trainingszeit wurde abgesagt oder entfernt.", false],
].map(([type, group, label, description, recommended]) => ({ type, group, label, description, recommended }));

export const notificationEmailSettingDefinitions = Object.freeze(definitions);
export const notificationEmailSettingGroups = Object.freeze([
  { key: "membership", label: "Mitgliedsanfragen" },
  { key: "team", label: "Mannschaft & Spieler" },
  { key: "trainer", label: "Trainer & Betreuer" },
  { key: "contributions", label: "Vereinsbeiträge" },
  { key: "members", label: "Mitglieder" },
  { key: "events", label: "Termine & Training" },
]);
const byType = new Map(definitions.map((item) => [item.type, item]));
export const normalizeNotificationEmailSettingType = (value) => String(value || "").trim().toLowerCase();
export const getNotificationEmailSettingDefinition = (value) => byType.get(normalizeNotificationEmailSettingType(value)) || null;
export const isKnownNotificationEmailSettingType = (value) => Boolean(getNotificationEmailSettingDefinition(value));
export const recommendedNotificationEmailSettings = () => definitions.map(({ type, recommended }) => ({ notification_type: type, email_enabled: recommended }));
export const hasActiveSuperadminRole = (roles = []) => roles.some((role) => role?.key === "superadmin" && role?.is_active !== false);

export function buildNotificationEmailSettingsDto(masterRow, typeRows = []) {
  const values = new Map(typeRows.map((row) => [row.notification_type, row.email_enabled === true]));
  return {
    masterEnabled: masterRow?.setting_key === "global" && masterRow.email_delivery_enabled === true,
    items: definitions.map((item) => ({ ...item, enabled: values.get(item.type) === true })),
  };
}

export function resolveNotificationEmailDeliveryPolicy(masterRow, typeRows = [], type) {
  const normalized = normalizeNotificationEmailSettingType(type);
  const typeRow = typeRows.find((row) => row.notification_type === normalized);
  return {
    globalEnabled: masterRow?.setting_key === "global" && masterRow.email_delivery_enabled === true,
    typeEnabled: typeRow?.email_enabled === true,
  };
}
