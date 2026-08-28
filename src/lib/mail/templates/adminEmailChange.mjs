import { escapeMailHtml } from "../mail.core.mjs";

export const ADMIN_EMAIL_CHANGE_SUBJECTS = {
  requestedOld: "Änderung deiner Login-E-Mail-Adresse angefordert",
  confirmNew: "Neue Login-E-Mail-Adresse bestätigen",
  completedOld: "Login-E-Mail-Adresse wurde geändert",
  completedNew: "Login-E-Mail-Adresse erfolgreich geändert",
};

function paragraphs(lines) {
  return lines.map((line) => `<p>${escapeMailHtml(line)}</p>`).join("");
}

export function buildAdminEmailChangeOldWarningMail() {
  const lines = [
    "Für dein Benutzerkonto wurde durch die Benutzerverwaltung eine Änderung deiner Login-E-Mail-Adresse angefordert.",
    "Deine bisherige Login-E-Mail-Adresse bleibt aktiv, bis die neue Adresse bestätigt wurde.",
    "Der Bestätigungslink ist 15 Minuten gültig.",
    "Wenn du diese Änderung nicht erwartest, informiere bitte den Verein.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.requestedOld, text: lines.join("\n\n"), html: paragraphs(lines) };
}

export function buildAdminEmailChangeConfirmationMail({ confirmationUrl }) {
  const lines = [
    "Für dein Benutzerkonto wurde diese Adresse als neue Login-E-Mail-Adresse angefordert.",
    "Bitte bestätige die neue Adresse. Der Vorgang ist 15 Minuten gültig.",
    "Wenn du diese Änderung nicht erwartest, bestätige sie nicht.",
  ];
  return {
    subject: ADMIN_EMAIL_CHANGE_SUBJECTS.confirmNew,
    text: `${lines.join("\n\n")}\n\nNeue E-Mail-Adresse bestätigen: ${confirmationUrl}`,
    html: `${paragraphs(lines)}<p><a href="${escapeMailHtml(confirmationUrl)}">Neue E-Mail-Adresse bestätigen</a></p>`,
  };
}

export function buildAdminEmailChangeOldCompletionMail() {
  const lines = [
    "Die Login-E-Mail-Adresse deines Benutzerkontos wurde erfolgreich geändert.",
    "Die bisherige Adresse kann nicht mehr zur Anmeldung verwendet werden.",
    "Wenn du diese Änderung nicht erwartet hast, informiere bitte umgehend den Verein.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.completedOld, text: lines.join("\n\n"), html: paragraphs(lines) };
}

export function buildAdminEmailChangeNewCompletionMail() {
  const lines = [
    "Die Login-E-Mail-Adresse deines Benutzerkontos wurde erfolgreich geändert.",
    "Du kannst dich ab sofort mit dieser Adresse anmelden.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.completedNew, text: lines.join("\n\n"), html: paragraphs(lines) };
}
