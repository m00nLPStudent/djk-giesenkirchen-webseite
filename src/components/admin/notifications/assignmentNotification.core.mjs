const FALLBACK_ROUTE = "/admin/notifications";

function text(value, fallback) {
  return String(value || "").trim() || fallback;
}

export function personName(person = {}, fallback = "Unbekannte Person") {
  return text(
    `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.name,
    fallback,
  );
}

export function assignmentLabel(assignment = {}) {
  return {
    teamName: text(assignment.teamNameDe || assignment.team_name_de, "Mannschaft"),
    seasonName: text(assignment.seasonName || assignment.season_name, "angegebene Saison"),
  };
}

function metadata(assignment, action, idempotencyKey) {
  const labels = assignmentLabel(assignment);
  return {
    teamId: assignment.teamId || null,
    teamSeasonId: assignment.teamSeasonId || null,
    teamName: labels.teamName,
    seasonId: assignment.seasonId || null,
    seasonLabel: labels.seasonName,
    assignmentAction: action,
    idempotencyKey,
  };
}

export function buildPlayerAssignedNotification({ player, assignment, assignmentId }) {
  const labels = assignmentLabel(assignment);
  return {
    type: "player_assigned",
    title: "Neuer Spieler in deiner Mannschaft",
    message: `${personName(player, "Ein Spieler")} wurde der ${labels.teamName} für die Saison ${labels.seasonName} zugeordnet. Bitte prüfe die hinterlegten Daten.`,
    entityType: "player",
    entityId: player.id,
    preferredTarget: `/admin/players/edit/${player.id}`,
    fallbackTarget: `/admin/teams/${assignment.teamId}`,
    metadata: metadata(assignment, "assigned", `player_assigned:${assignmentId || player.id}`),
  };
}

export function buildPlayerRemovedNotification({ player, assignment, assignmentId }) {
  const labels = assignmentLabel(assignment);
  return {
    type: "player_removed",
    title: "Spieler aus deiner Mannschaft entfernt",
    message: `${personName(player, "Ein Spieler")} wurde aus dem aktiven Kader der ${labels.teamName} für die Saison ${labels.seasonName} entfernt.`,
    entityType: "player",
    entityId: player.id,
    preferredTarget: `/admin/players/edit/${player.id}`,
    fallbackTarget: `/admin/teams/${assignment.teamId}`,
    metadata: { ...metadata(assignment, "removed", `player_removed:${assignmentId || player.id}`), accessLost: true, notificationDetailOnly: true },
  };
}

export function buildPlayerUpdatedNotification({ player, assignment, assignmentId }) {
  const labels = assignmentLabel(assignment);
  return {
    type: "player_updated",
    title: "Spielerzuordnung geändert",
    message: `Die saisonale Zuordnung von ${personName(player, "einem Spieler")} bei der ${labels.teamName} für ${labels.seasonName} wurde geändert.`,
    entityType: "player",
    entityId: player.id,
    preferredTarget: `/admin/players/edit/${player.id}`,
    fallbackTarget: `/admin/teams/${assignment.teamId}`,
    metadata: metadata(assignment, "updated", `player_updated:${assignmentId || player.id}`),
  };
}

export function buildTrainerNotification({ type, coach, assignment, previousRole, assignmentId }) {
  const labels = assignmentLabel(assignment);
  const role = text(assignment.roleDe, "Trainer/Betreuer");
  const base = {
    type,
    entityType: "team",
    entityId: assignment.teamId,
    preferredTarget: type === "trainer_removed" ? `/admin/coaches/edit/${coach.id}` : `/admin/teams/${assignment.teamId}`,
    fallbackTarget: FALLBACK_ROUTE,
    metadata: {
      ...metadata(assignment, type.replace("trainer_", ""), `${type}:${assignmentId || coach.id}:${assignment.teamSeasonId || "team"}`),
      roleLabel: role,
    },
  };
  if (type === "trainer_assigned") return { ...base, title: "Neue Mannschaftszuordnung", message: `Du wurdest der ${labels.teamName} für die Saison ${labels.seasonName} als ${role} zugeordnet.` };
  if (type === "trainer_removed") return { ...base, title: "Mannschaftszuordnung beendet", message: `Deine Zuordnung zur ${labels.teamName} als ${text(previousRole || role, "Trainer/Betreuer")} für die Saison ${labels.seasonName} wurde beendet. Du hast deshalb keinen Zugriff mehr auf diese Mannschaft.`, metadata: { ...base.metadata, accessLost: true, notificationDetailOnly: true } };
  return { ...base, title: "Funktion in der Mannschaft geändert", message: `Deine Funktion bei der ${labels.teamName} wurde von ${text(previousRole, "Trainer/Betreuer")} zu ${role} geändert.` };
}

export function deduplicateRecipients(recipients = [], actorUserId = null) {
  return [...new Map(recipients.filter((item) => item?.userId && item.userId !== actorUserId).map((item) => [item.userId, item])).values()];
}

export function resolveNotificationTargetForRecipient(recipient, event) {
  if (event.metadata?.notificationDetailOnly || event.metadata?.accessLost || ["trainer_removed", "player_removed", "team_archived"].includes(event.type)) return FALLBACK_ROUTE;
  if (event.type.startsWith("player_") && recipient.permissionKeys?.includes("players.edit")) return event.preferredTarget;
  if (event.type === "trainer_removed" && recipient.permissionKeys?.includes("coaches.edit")) return event.preferredTarget;
  if (event.type.startsWith("trainer_") && recipient.permissionKeys?.includes("teams.view")) return event.preferredTarget;
  if (recipient.permissionKeys?.includes("teams.view") && event.fallbackTarget?.startsWith("/admin/teams/")) return event.fallbackTarget;
  return FALLBACK_ROUTE;
}

export const chooseSafeTarget = resolveNotificationTargetForRecipient;

export function buildTeamArchivedNotification({ team, assignment, assignmentId }) {
  const labels = assignmentLabel(assignment);
  return {
    type: "team_changed",
    title: "Mannschaft archiviert",
    message: `Die Mannschaft ${labels.teamName} für die Saison ${labels.seasonName} wurde archiviert. Die bisherige Mannschaftsseite ist deshalb nicht mehr verfügbar.`,
    entityType: "team",
    entityId: team.id,
    preferredTarget: FALLBACK_ROUTE,
    fallbackTarget: FALLBACK_ROUTE,
    metadata: { ...metadata(assignment, "archived", `team_archived:${assignmentId || team.id}`), accessLost: true, notificationDetailOnly: true },
  };
}
