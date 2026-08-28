import { createHash, randomBytes } from "node:crypto";
import { normalizeLoginEmail, validateLoginEmail } from "./adminUserEmailSync.core.mjs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
export const EMAIL_CHANGE_CONFIRMATION_TTL_MINUTES = 15;

const errorResult = (reason, message) => ({
  ok: false,
  reason,
  message,
  errors: { email: message },
});

export function createEmailChangeToken() {
  return randomBytes(32).toString("base64url");
}

export function isValidEmailChangeToken(token) {
  return TOKEN_PATTERN.test(String(token || ""));
}

export function hashEmailChangeToken(token) {
  if (!isValidEmailChangeToken(token)) return "";
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildEmailChangeExpiry(now = new Date()) {
  return new Date(
    now.getTime() + EMAIL_CHANGE_CONFIRMATION_TTL_MINUTES * 60 * 1000,
  ).toISOString();
}

export async function executeAdminEmailChangeRequest({
  actorUserId,
  targetUserId,
  requestedEmail,
  confirmationBaseUrl,
  dependencies,
  now = () => new Date(),
  createToken = createEmailChangeToken,
}) {
  if (!UUID_PATTERN.test(String(actorUserId || "")) || !UUID_PATTERN.test(String(targetUserId || ""))) {
    return errorResult("invalid-target", "Benutzer konnte nicht gefunden werden.");
  }
  const validation = validateLoginEmail(requestedEmail);
  if (!validation.ok) return errorResult("invalid-email", validation.message);
  if (!confirmationBaseUrl) {
    return errorResult("missing-site-url", "Bestätigungslink konnte nicht erstellt werden.");
  }

  const [authState, profileState] = await Promise.all([
    dependencies.loadAuthUser(targetUserId),
    dependencies.loadProfile(targetUserId),
  ]);
  if (!authState?.ok || !profileState?.ok) {
    return errorResult("user-not-found", "Benutzer konnte nicht gefunden werden.");
  }
  const oldAuthEmail = normalizeLoginEmail(authState.user?.email);
  const oldProfileEmail = normalizeLoginEmail(profileState.profile?.email);
  if (!oldAuthEmail || oldAuthEmail !== oldProfileEmail) {
    return errorResult("inconsistent-state", "Der Benutzerzustand ist inkonsistent.");
  }
  if (validation.email === oldAuthEmail) {
    return { ok: true, changed: false, message: "Keine Änderung erkannt." };
  }

  const [authConflict, profileConflict] = await Promise.all([
    dependencies.hasAuthEmailConflict(validation.email, targetUserId),
    dependencies.hasProfileEmailConflict(validation.email, targetUserId),
  ]);
  if (!authConflict?.ok || !profileConflict?.ok) {
    return errorResult("conflict-check-failed", "E-Mail-Adresse konnte nicht sicher geprüft werden.");
  }
  if (authConflict.conflict || profileConflict.conflict) {
    return errorResult("email-conflict", "Diese E-Mail-Adresse ist bereits vergeben.");
  }

  const active = await dependencies.loadActiveRequest(targetUserId);
  if (!active?.ok) return errorResult("request-check-failed", "E-Mail-Änderung konnte nicht vorbereitet werden.");
  const timestamp = now();
  if (["confirming", "compensating"].includes(active.request?.status)) {
    return errorResult("confirmation-in-progress", "Eine E-Mail-Änderung wird bereits abgeschlossen.");
  }
  if (active.request?.status === "pending") {
    const expired = new Date(active.request.expires_at).getTime() <= timestamp.getTime();
    const terminalized = expired
      ? await dependencies.expireRequest(active.request.id, timestamp.toISOString())
      : await dependencies.cancelRequest(active.request.id, timestamp.toISOString());
    if (!terminalized?.ok) {
      return errorResult("request-replacement-failed", "E-Mail-Änderung konnte nicht vorbereitet werden.");
    }
  }

  const rawToken = createToken();
  const tokenHash = hashEmailChangeToken(rawToken);
  if (!tokenHash) return errorResult("token-generation-failed", "Bestätigungslink konnte nicht erstellt werden.");
  const created = await dependencies.createRequest({
    user_id: targetUserId,
    requested_by: actorUserId,
    old_email: oldAuthEmail,
    new_email: validation.email,
    token_hash: tokenHash,
    status: "pending",
    expires_at: buildEmailChangeExpiry(timestamp),
  });
  if (!created?.ok || !created.request?.id) {
    return errorResult("request-create-failed", "E-Mail-Änderung konnte nicht angefordert werden.");
  }

  const warning = await dependencies.sendOldAddressWarning({
    requestId: created.request.id,
    oldEmail: oldAuthEmail,
  });
  if (!warning?.ok) {
    await dependencies.failRequest(created.request.id, "old_mail_failed");
    return errorResult("mail-delivery-failed", "Bestätigungs-E-Mail konnte nicht versendet werden.");
  }
  const confirmationUrl = `${confirmationBaseUrl}?token=${encodeURIComponent(rawToken)}`;
  const confirmation = await dependencies.sendNewAddressConfirmation({
    requestId: created.request.id,
    newEmail: validation.email,
    confirmationUrl,
  });
  if (!confirmation?.ok) {
    await dependencies.failRequest(created.request.id, "confirmation_mail_failed");
    return errorResult("mail-delivery-failed", "Bestätigungs-E-Mail konnte nicht versendet werden.");
  }

  return {
    ok: true,
    changed: true,
    pending: true,
    message: "Bestätigungs-E-Mail wurde versendet. Die bisherige Login-E-Mail bleibt bis zur Bestätigung aktiv.",
  };
}

export async function inspectAdminEmailChangeToken({ token, dependencies, now = () => new Date() }) {
  const tokenHash = hashEmailChangeToken(token);
  if (!tokenHash) return { status: "invalid" };
  const found = await dependencies.findRequestByTokenHash(tokenHash);
  if (!found?.ok || !found.request) return { status: "invalid" };
  if (found.request.status !== "pending") return { status: "invalid" };
  if (new Date(found.request.expires_at).getTime() <= now().getTime()) return { status: "expired" };
  return { status: "valid" };
}

export async function executeAdminEmailChangeConfirmation({ token, dependencies, now = () => new Date() }) {
  const tokenHash = hashEmailChangeToken(token);
  if (!tokenHash) return { ok: false, status: "invalid" };
  const timestamp = now().toISOString();
  const claim = await dependencies.claimRequest(tokenHash, timestamp);
  if (!claim?.ok || !claim.request) {
    const expired = await dependencies.expireRequestByTokenHash(tokenHash, timestamp);
    return { ok: false, status: expired?.expired ? "expired" : "invalid" };
  }
  const request = claim.request;

  const compensate = async ({ successCode, allowCompleted }) => {
    const compensationStartedAt = now().toISOString();
    const claimed = await dependencies.claimCompensation({
      requestId: request.id,
      userId: request.user_id,
      oldEmail: normalizeLoginEmail(request.old_email),
      newEmail: normalizeLoginEmail(request.new_email),
      workflowTimestamp: timestamp,
      compensationStartedAt,
      allowCompleted,
    });
    const claimedRequest = claimed?.request;
    const claimVerified = Boolean(
      claimed?.ok
      && claimedRequest?.status === "compensating"
      && claimedRequest?.id === request.id
      && claimedRequest?.user_id === request.user_id
      && normalizeLoginEmail(claimedRequest?.old_email) === normalizeLoginEmail(request.old_email)
      && normalizeLoginEmail(claimedRequest?.new_email) === normalizeLoginEmail(request.new_email)
      && Date.parse(claimedRequest?.confirmed_at) === Date.parse(timestamp)
      && Date.parse(claimedRequest?.compensation_started_at) === Date.parse(compensationStartedAt)
      && Boolean(claimedRequest?.locked_at)
    );
    if (!claimVerified) {
      await dependencies.failRequest(request.id, "compensation_claim_failed");
      dependencies.logManualReview?.("compensation_claim_failed");
      return { ok: false, failureCode: "compensation_claim_failed" };
    }

    const reversed = await dependencies.reverseAuthEmail({
      userId: request.user_id,
      expectedCurrentEmail: normalizeLoginEmail(request.new_email),
      originalEmail: normalizeLoginEmail(request.old_email),
    });
    const failureCode = reversed?.ok ? successCode : "compensation_failed";
    const terminal = await dependencies.finishCompensation(request.id, failureCode);
    if (!reversed?.ok) dependencies.logManualReview?.("compensation_failed");
    if (!terminal?.ok) dependencies.logManualReview?.("compensation_terminalization_failed");
    return { ok: Boolean(reversed?.ok && terminal?.ok), failureCode };
  };

  const fail = async (failureCode) => {
    await dependencies.failRequest(request.id, failureCode);
    return { ok: false, status: "failed", message: "Die E-Mail-Adresse konnte nicht sicher geändert werden." };
  };

  const requester = await dependencies.validateRequester(request.requested_by);
  if (!requester?.ok) return fail("requester_not_authorized");
  const [authState, profileState] = await Promise.all([
    dependencies.loadAuthUser(request.user_id),
    dependencies.loadProfile(request.user_id),
  ]);
  if (!authState?.ok || !profileState?.ok) return fail("target_missing");
  const expectedOld = normalizeLoginEmail(request.old_email);
  if (
    normalizeLoginEmail(authState.user?.email) !== expectedOld ||
    normalizeLoginEmail(profileState.profile?.email) !== expectedOld
  ) return fail("state_changed");

  const [authConflict, profileConflict] = await Promise.all([
    dependencies.hasAuthEmailConflict(request.new_email, request.user_id),
    dependencies.hasProfileEmailConflict(request.new_email, request.user_id),
  ]);
  if (!authConflict?.ok || !profileConflict?.ok) return fail("conflict_check_failed");
  if (authConflict.conflict || profileConflict.conflict) return fail("target_email_conflict");

  const finalized = await dependencies.finalizeEmailChange({
    targetUserId: request.user_id,
    requestedEmail: request.new_email,
  });
  if (!finalized?.ok || finalized.changed !== true) {
    if (finalized?.requiresCompensation) {
      await compensate({ successCode: "email_sync_failed_compensated", allowCompleted: false });
      return { ok: false, status: "failed", message: "Die E-Mail-Adresse konnte nicht sicher geändert werden." };
    }
    return fail("email_sync_failed");
  }
  const completed = await dependencies.completeRequest(request.id, timestamp);
  if (!completed?.ok) {
    await compensate({ successCode: "completion_state_failed_compensated", allowCompleted: true });
    return { ok: false, status: "failed", message: "Die E-Mail-Adresse konnte nicht sicher geändert werden." };
  }

  await Promise.allSettled([
    dependencies.sendOldAddressCompletion({ requestId: request.id, oldEmail: request.old_email }),
    dependencies.sendNewAddressCompletion({ requestId: request.id, newEmail: request.new_email }),
  ]);
  return { ok: true, status: "completed", message: "Deine neue Login-E-Mail-Adresse wurde erfolgreich bestätigt." };
}
