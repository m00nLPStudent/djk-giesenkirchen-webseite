import { getActorContext } from "@/components/admin/users/services/usersActionWriteHelpers";
import { applyProfileCardLinks } from "@/components/admin/users/services/usersActionProfileCardLinkHelpers";

function toIntentLabel(value) {
  if (value === undefined) return "unchanged";
  if (value === null) return "unlink";
  const normalized = String(value || "").trim();
  return normalized ? "link" : "unlink";
}

function logActionWrite(stage) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[B12.2a-1.2][CardLink][ActionWrite]", stage);
}

export async function applyCardLinkChanges({
  branch,
  userId,
  payload,
  hasBoardIntent,
  hasCoachIntent,
  managesCardLinks,
  supabaseServer,
}) {
  if (!managesCardLinks) return { ok: true };

  logActionWrite({
    branch,
    adminProfileIdPresent: Boolean(userId),
    board: {
      hasIntent: hasBoardIntent,
      intent: hasBoardIntent
        ? toIntentLabel(payload.linked_board_member_id)
        : "unchanged",
    },
    coach: {
      hasIntent: hasCoachIntent,
      intent: hasCoachIntent
        ? toIntentLabel(payload.linked_coach_id)
        : "unchanged",
    },
  });

  const superadminActor = await getActorContext(supabaseServer);
  if (!superadminActor.ok) {
    return {
      ok: false,
      reason: superadminActor.reason,
      message:
        superadminActor.message ||
        "Nur Superadmin darf Kachelverknuepfungen bearbeiten.",
    };
  }

  return await applyProfileCardLinks({
    adminProfileId: userId,
    linkedBoardMemberId: payload.linked_board_member_id,
    linkedCoachId: payload.linked_coach_id,
    supabaseServer,
  });
}
