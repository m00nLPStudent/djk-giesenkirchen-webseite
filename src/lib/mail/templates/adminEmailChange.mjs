import { normalizeMailActionUrl, renderClubMailLayout } from "./clubMailLayout.mjs";

export const ADMIN_EMAIL_CHANGE_SUBJECTS = {
  requestedOld: "Änderung deiner Login-E-Mail-Adresse angefordert",
  confirmNew: "Neue Login-E-Mail-Adresse bestätigen",
  completedOld: "Login-E-Mail-Adresse wurde geändert",
  completedNew: "Login-E-Mail-Adresse erfolgreich geändert",
};

const render = (title, lines, action = null, siteUrl = null) => renderClubMailLayout({ title, paragraphs: lines, action, siteUrl });

export function buildAdminEmailChangeOldWarningMail({ siteUrl = null } = {}) {
  const lines = [
    "Für dein Benutzerkonto wurde durch die Benutzerverwaltung eine Änderung deiner Login-E-Mail-Adresse angefordert.",
    "Deine bisherige Login-E-Mail-Adresse bleibt aktiv, bis die neue Adresse bestätigt wurde.",
    "Der Bestätigungslink ist 15 Minuten gültig.",
    "Wenn du diese Änderung nicht erwartest, informiere bitte den Verein.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.requestedOld, text: lines.join("\n\n"), html: render(ADMIN_EMAIL_CHANGE_SUBJECTS.requestedOld, lines, null, siteUrl) };
}

export function buildAdminEmailChangeConfirmationMail({ confirmationUrl, siteUrl = null }) {
  const lines = [
    "Für dein Benutzerkonto wurde diese Adresse als neue Login-E-Mail-Adresse angefordert.",
    "Bitte bestätige die neue Adresse. Der Vorgang ist 15 Minuten gültig.",
    "Wenn du diese Änderung nicht erwartest, bestätige sie nicht.",
  ];
  const safeConfirmationUrl = normalizeMailActionUrl(confirmationUrl);
  return {
    subject: ADMIN_EMAIL_CHANGE_SUBJECTS.confirmNew,
    text: safeConfirmationUrl ? `${lines.join("\n\n")}\n\nNeue E-Mail-Adresse bestätigen: ${safeConfirmationUrl}` : lines.join("\n\n"),
    html: render(ADMIN_EMAIL_CHANGE_SUBJECTS.confirmNew, lines, safeConfirmationUrl ? { label: "Neue E-Mail-Adresse bestätigen", url: safeConfirmationUrl } : null, siteUrl),
  };
}

export function buildAdminEmailChangeOldCompletionMail({ siteUrl = null } = {}) {
  const lines = [
    "Die Login-E-Mail-Adresse deines Benutzerkontos wurde erfolgreich geändert.",
    "Die bisherige Adresse kann nicht mehr zur Anmeldung verwendet werden.",
    "Wenn du diese Änderung nicht erwartet hast, informiere bitte umgehend den Verein.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.completedOld, text: lines.join("\n\n"), html: render(ADMIN_EMAIL_CHANGE_SUBJECTS.completedOld, lines, null, siteUrl) };
}

export function buildAdminEmailChangeNewCompletionMail({ siteUrl = null } = {}) {
  const lines = [
    "Die Login-E-Mail-Adresse deines Benutzerkontos wurde erfolgreich geändert.",
    "Du kannst dich ab sofort mit dieser Adresse anmelden.",
  ];
  return { subject: ADMIN_EMAIL_CHANGE_SUBJECTS.completedNew, text: lines.join("\n\n"), html: render(ADMIN_EMAIL_CHANGE_SUBJECTS.completedNew, lines, null, siteUrl) };
}
