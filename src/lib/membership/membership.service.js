import {
  insertMembershipRequest,
  updateMembershipRequest,
} from "./membership.repository";
import { prepareMembershipRequest } from "./membershipSubmit.core.mjs";
import { resolveMembershipFootballTeamSelection } from "./membershipTeamResolver.service";

export async function submitMembershipRequest(payload, { client } = {}) {
  const prepared = await prepareMembershipRequest(payload, {
    resolveTeamSeasonSelection: (birthdate, teamSeasonId) => resolveMembershipFootballTeamSelection(birthdate, teamSeasonId, { client }),
  });
  if (prepared.error) return prepared;

  const result = await insertMembershipRequest(prepared.data, client);

  if (result.error) {
    return result;
  }

  return { ...result, submittedRequest: prepared.data };
}

export async function saveMembershipRequestStatus(request, payload, { client } = {}) {
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

  return await updateMembershipRequest(request.id, nextPayload, client);
}

export async function forwardMembershipRequest(request, payload, { client } = {}) {
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

  return await updateMembershipRequest(request.id, nextPayload, client);
}
