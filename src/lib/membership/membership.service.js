import {
  insertMembershipRequest,
  updateMembershipRequest,
} from "./membership.repository";
import { sendMembershipRequestNotifications } from "./membership.mail";

export async function submitMembershipRequest(payload) {
  const result = await insertMembershipRequest(payload);

  if (result.error) {
    return result;
  }

  await sendMembershipRequestNotifications(payload);

  return result;
}

export async function saveMembershipRequestStatus(request, payload) {
  const nextPayload = {
    status: payload.status,
  };

  if (Object.prototype.hasOwnProperty.call(request || {}, "internal_note")) {
    nextPayload.internal_note = payload.internal_note || null;
  }

  if (
    payload.status === "done" &&
    Object.prototype.hasOwnProperty.call(request || {}, "processed_at")
  ) {
    nextPayload.processed_at = new Date().toISOString();
  }

  return await updateMembershipRequest(request.id, nextPayload);
}

export async function forwardMembershipRequest(request, payload) {
  const nextPayload = {
    forwarded_to_type: payload.forwarded_to_type,
    forwarded_to_id: payload.forwarded_to_id,
    forwarded_to_name: payload.forwarded_to_name,
    forwarded_to_email: payload.forwarded_to_email || null,
    forwarded_at: new Date().toISOString(),
    forwarded_note: payload.forwarded_note || null,
  };

  if (
    Object.prototype.hasOwnProperty.call(request || {}, "status") &&
    request.status === "new"
  ) {
    nextPayload.status = "in_progress";
  }

  return await updateMembershipRequest(request.id, nextPayload);
}
