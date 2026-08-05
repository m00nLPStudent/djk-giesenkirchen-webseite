export function isMembershipRequestAssignedToCoach(request = {}, coachId = null) {
  return Boolean(coachId && request.forwarded_to_type === "coach" && String(request.forwarded_to_id || "") === String(coachId));
}
