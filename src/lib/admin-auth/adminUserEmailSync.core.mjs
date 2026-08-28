const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_LOGIN_EMAIL_LENGTH = 254;

export function normalizeLoginEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateLoginEmail(value) {
  const email = normalizeLoginEmail(value);
  if (!email) {
    return { ok: false, email, message: "E-Mail ist erforderlich." };
  }
  if (email.length > MAX_LOGIN_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      email,
      message: "Bitte eine gültige E-Mail-Adresse eingeben.",
    };
  }
  return { ok: true, email };
}

function stateError(reason, message) {
  return { ok: false, reason, message, errors: { email: message } };
}

export async function synchronizeAdminUserEmail({
  targetUserId,
  requestedEmail,
  dependencies,
}) {
  if (!UUID_PATTERN.test(String(targetUserId || "").trim())) {
    return stateError("invalid-target", "Benutzer konnte nicht gefunden werden.");
  }

  const validation = validateLoginEmail(requestedEmail);
  if (!validation.ok) {
    return stateError("invalid-email", validation.message);
  }

  const [authState, profileState] = await Promise.all([
    dependencies.loadAuthUser(targetUserId),
    dependencies.loadProfile(targetUserId),
  ]);

  if (!authState?.ok || !profileState?.ok) {
    return stateError("user-not-found", "Benutzer konnte nicht gefunden werden.");
  }

  const authUser = authState.user;
  const profile = profileState.profile;
  if (authUser?.id !== targetUserId || profile?.id !== targetUserId) {
    return stateError("inconsistent-state", "Der Benutzerzustand ist inkonsistent.");
  }

  const originalAuthEmail = normalizeLoginEmail(authUser.email);
  const originalProfileEmail = normalizeLoginEmail(profile.email);
  if (!originalAuthEmail || originalAuthEmail !== originalProfileEmail) {
    return stateError("inconsistent-state", "Der Benutzerzustand ist inkonsistent.");
  }

  if (validation.email === originalAuthEmail) {
    return { ok: true, changed: false, message: "Keine Änderung erkannt." };
  }

  const [authConflict, profileConflict] = await Promise.all([
    dependencies.hasAuthEmailConflict(validation.email, targetUserId),
    dependencies.hasProfileEmailConflict(validation.email, targetUserId),
  ]);
  if (!authConflict?.ok || !profileConflict?.ok) {
    return stateError(
      "conflict-check-failed",
      "E-Mail-Adresse konnte nicht sicher geprüft werden.",
    );
  }
  if (authConflict.conflict || profileConflict.conflict) {
    return stateError("email-conflict", "Diese E-Mail-Adresse ist bereits vergeben.");
  }

  const authUpdate = await dependencies.updateAuthEmail(
    targetUserId,
    validation.email,
  );
  if (!authUpdate?.ok) {
    return stateError(
      "auth-update-failed",
      "Die Login-E-Mail konnte nicht geändert werden.",
    );
  }

  const verifyAuth = await dependencies.loadAuthUser(targetUserId);
  const authVerified = Boolean(
    verifyAuth?.ok &&
      verifyAuth.user?.id === targetUserId &&
      normalizeLoginEmail(verifyAuth.user?.email) === validation.email,
  );
  if (!authVerified) {
    return {
      ...stateError("auth-verification-failed", "Die Änderung konnte nicht sicher abgeschlossen werden."),
      requiresCompensation: true,
      requiresManualReview: true,
    };
  }

  const profileUpdate = await dependencies.updateProfileEmail(
    targetUserId,
    validation.email,
  );
  if (!profileUpdate?.ok) {
    return {
      ...stateError("profile-update-failed", "Die Änderung konnte nicht sicher abgeschlossen werden."),
      requiresCompensation: true,
      requiresManualReview: true,
    };
  }

  const [finalAuth, finalProfile] = await Promise.all([
    dependencies.loadAuthUser(targetUserId),
    dependencies.loadProfile(targetUserId),
  ]);
  const finalStateValid = Boolean(
    finalAuth?.ok &&
      finalProfile?.ok &&
      finalAuth.user?.id === targetUserId &&
      finalProfile.profile?.id === targetUserId &&
      normalizeLoginEmail(finalAuth.user?.email) === validation.email &&
      normalizeLoginEmail(finalProfile.profile?.email) === validation.email,
  );

  if (!finalStateValid) {
    return {
      ...stateError("profile-verification-failed", "Die Änderung konnte nicht sicher abgeschlossen werden."),
      requiresCompensation: true,
      requiresManualReview: true,
    };
  }

  return {
    ok: true,
    changed: true,
    message: "Die Login-E-Mail wurde erfolgreich geändert.",
  };
}
