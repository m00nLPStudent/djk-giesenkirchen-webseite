export const MEMBERSHIP_REQUEST_TYPES = Object.freeze([
  "aktives-mitglied-fussball",
  "aktives-mitglied-tischtennis",
  "aktives-mitglied-gymnastik-damen",
  "aktives-mitglied-behindertensport",
  "trainer-werden",
  "passives-mitglied",
]);

export const MEMBERSHIP_PRIVACY_POLICY_VERSION = "2026-08-26";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9()/.\s-]+$/;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(message, field) {
  return { data: null, error: { message, field, code: "VALIDATION_ERROR" } };
}

export function getMembershipYearGroup(birthdate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(birthdate));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return String(year);
}

export async function prepareMembershipRequest(payload, { resolveTeamSeasonSelection, now = new Date() } = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  if (text(source.website)) return fail("Die Anfrage konnte nicht gesendet werden.", "website");

  const firstName = text(source.first_name);
  const lastName = text(source.last_name);
  const phone = text(source.phone);
  const email = text(source.email).toLowerCase();
  const birthdate = text(source.birthdate);
  const requestType = text(source.request_type);
  const message = text(source.message);

  if (!firstName) return fail("Bitte den Vornamen angeben.", "first_name");
  if (firstName.length > 100) return fail("Der Vorname ist zu lang.", "first_name");
  if (!lastName) return fail("Bitte den Nachnamen angeben.", "last_name");
  if (lastName.length > 100) return fail("Der Nachname ist zu lang.", "last_name");
  if (!phone) return fail("Bitte eine Telefonnummer angeben.", "phone");
  const phoneDigits = phone.replace(/\D/g, "");
  if (phone.length > 50 || !PHONE_PATTERN.test(phone) || phoneDigits.length < 5 || phoneDigits.length > 20) return fail("Bitte eine gültige Telefonnummer angeben.", "phone");
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) return fail("Bitte eine gültige E-Mail-Adresse angeben.", "email");

  const yearGroup = getMembershipYearGroup(birthdate);
  if (!yearGroup) return fail("Bitte ein gültiges Geburtsdatum angeben.", "birthdate");
  const birthdateValue = new Date(`${birthdate}T00:00:00.000Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (birthdateValue > today) return fail("Das Geburtsdatum darf nicht in der Zukunft liegen.", "birthdate");
  if (Number(yearGroup) < 1900) return fail("Bitte ein plausibles Geburtsdatum angeben.", "birthdate");
  if (!MEMBERSHIP_REQUEST_TYPES.includes(requestType)) return fail("Bitte eine gültige Art der Anfrage auswählen.", "request_type");
  if (source.privacy_accepted !== true) return fail("Bitte der Datenschutzerklärung zustimmen.", "privacy_accepted");
  if (message.length > 2000) return fail("Die Nachricht ist zu lang.", "message");

  let desiredTeamId = null;
  let desiredTeamSeasonId = null;
  if (requestType === "aktives-mitglied-fussball" && text(source.desired_team_season_id)) {
    desiredTeamSeasonId = text(source.desired_team_season_id);
    if (!UUID_PATTERN.test(desiredTeamSeasonId)) return fail("Die ausgewählte Mannschaft ist ungültig.", "desired_team_season_id");
    if (typeof resolveTeamSeasonSelection !== "function") throw new Error("Mannschaftssaison-Validierung ist nicht konfiguriert.");
    const selected = await resolveTeamSeasonSelection(birthdate, desiredTeamSeasonId);
    if (selected?.error) throw selected.error;
    if (!selected?.data) return fail("Die ausgewählte Mannschaft passt nicht zu Jahrgang und aktueller Saison.", "desired_team_season_id");
    desiredTeamId = selected.data.teamId;
    desiredTeamSeasonId = selected.data.teamSeasonId;
  }

  return {
    data: {
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      birthdate,
      request_type: requestType,
      year_group: yearGroup,
      desired_team_id: desiredTeamId,
      desired_team_season_id: desiredTeamSeasonId,
      message: message || null,
      privacy_consent: true,
      privacy_consent_at: now.toISOString(),
      privacy_policy_version: MEMBERSHIP_PRIVACY_POLICY_VERSION,
    },
    error: null,
  };
}
