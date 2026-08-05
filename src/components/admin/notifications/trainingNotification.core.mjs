const CENTER = "/admin/notifications";
const weekdays = ["sonntags", "montags", "dienstags", "mittwochs", "donnerstags", "freitags", "samstags"];
const text = (value, fallback) => String(value || "").trim() || fallback;
const time = (value) => text(value, "–").slice(0, 5);
const date = (value) => value ? new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(`${value}T12:00:00`)) : "einem noch unbekannten Tag";

function timeDescription(item = {}) {
  return `${weekdays[Number(item.weekday)] || "am gewählten Wochentag"} von ${time(item.start_time)} bis ${time(item.end_time)} Uhr`;
}

export function buildTrainingTimeNotification(plan, item = {}, context = {}) {
  const team = text(context.teamName, "der Mannschaft");
  const previous = context.previous || {};
  const labels = {
    created: ["Neue Trainingszeit", `Für ${team} wurde ${timeDescription(item)} eine neue Trainingszeit eingetragen.`],
    updated: ["Trainingszeit geändert", `Die Trainingszeit von ${team} wurde von ${timeDescription(previous)} auf ${timeDescription(item)} geändert.`],
    removed: ["Trainingszeit entfernt", `Die Trainingszeit von ${team} ${timeDescription(previous.id ? previous : item)} wurde entfernt.`],
  };
  const [title, message] = labels[plan.action];
  return createTrainingEvent(plan, title, message, item.id || previous.id, item, context);
}

export function buildTrainingExceptionNotification(plan, item = {}, context = {}) {
  const team = text(context.teamName, "der Mannschaft");
  const previous = context.previous || {};
  const effective = item.exception_date || previous.exception_date;
  const movedTime = item.override_start_time ? ` um ${time(item.override_start_time)} Uhr` : "";
  const movedLocation = item.override_location_name ? ` auf ${item.override_location_name}` : "";
  const labels = {
    cancelled: ["Training abgesagt", `Das Training von ${team} am ${date(effective)} wurde abgesagt.`],
    moved: ["Training verschoben", `Das Training von ${team} am ${date(effective)} findet nun${movedTime}${movedLocation} statt.`],
    reverted: ["Training findet wieder statt", `Die Ausnahme für das Training von ${team} am ${date(effective)} wurde aufgehoben.`],
  };
  const [title, message] = labels[plan.action];
  return createTrainingEvent(plan, title, message, item.id || previous.id, item, { ...context, exceptionType: item.exception_type || previous.exception_type, date: effective });
}

function createTrainingEvent(plan, title, message, entityId, item, context) {
  const detailOnly = plan.action === "removed" || plan.action === "reverted";
  return {
    type: plan.type, title, message, entityType: "team_training", entityId: entityId || null,
    targetUrl: detailOnly ? CENTER : context.teamId ? `/admin/teams/${context.teamId}` : CENTER,
    metadata: {
      teamId: context.teamId || null, teamSeasonId: context.teamSeasonId || null, teamName: context.teamName || null,
      seasonId: context.seasonId || null, seasonLabel: context.seasonLabel || null, weekday: item.weekday ?? context.previous?.weekday ?? null,
      startTime: item.start_time || context.previous?.start_time || null, endTime: item.end_time || context.previous?.end_time || null,
      date: context.date || null, location: item.location_name || item.override_location_name || null, exceptionType: context.exceptionType || null,
      changedFields: plan.changedFields, assignmentAction: plan.action, notificationDetailOnly: detailOnly,
      idempotencyKey: `${plan.type}:${entityId || "unknown"}:${plan.action}:${item.updated_at || item.created_at || context.changeKey || "current"}`,
    },
  };
}

export function resolveTrainingTarget(recipient = {}, event = {}) {
  if (event.metadata?.notificationDetailOnly) return CENTER;
  return recipient.permissionKeys?.includes("teams.view") && event.metadata?.teamId ? `/admin/teams/${event.metadata.teamId}` : CENTER;
}
