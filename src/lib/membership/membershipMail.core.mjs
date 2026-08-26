import { createMailIdempotencyKey } from "../mail/mail.core.mjs";
import { buildMembershipRequestReceivedMail } from "../mail/templates/membershipRequestReceived.mjs";

export const membershipConfirmationIdempotencyKey = (requestId) => createMailIdempotencyKey("membership-request-received", requestId);

export async function executeMembershipRequestConfirmation(request = {}, { send, markSent, now = () => new Date().toISOString() } = {}) {
  if (request.mail_sent_at) return { ok: true, status: "already_sent", error: null };
  if (!request.id || !request.email || typeof send !== "function" || typeof markSent !== "function") {
    return { ok: false, status: "failed", error: { code: "membership_mail_input_invalid", message: "Membership-Maildaten sind unvollständig." } };
  }
  const content = buildMembershipRequestReceivedMail(request);
  const delivery = await send({
    to: request.email,
    ...content,
    idempotencyKey: membershipConfirmationIdempotencyKey(request.id),
  });
  if (!delivery?.ok) return delivery;
  const sentAt = now();
  const marked = await markSent(request.id, sentAt);
  if (marked?.error) return { ok: false, status: "sent_unmarked", delivered: true, error: { code: "mail_sent_marker_failed", message: "Mailstatus konnte nicht gespeichert werden." } };
  return { ok: true, status: "sent", sentAt, error: null };
}
