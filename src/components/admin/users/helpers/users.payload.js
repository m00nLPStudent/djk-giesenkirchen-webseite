function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function classifyLinkValue(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const normalized = String(value || "").trim();
  if (!normalized) return "empty-string";
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalized,
    )
  ) {
    return "uuid";
  }
  return "other";
}

function logPayloadLinkState(stage, value) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[B12.2a-1.1][CardLink][Payload]", {
    stage,
    valueState: classifyLinkValue(value),
    valueType: typeof value,
  });
}

export function buildUserEditorPayload(values = {}) {
  const primaryRoleId = values.primary_role_id || "";
  const additionalRoleIds = uniqueValues(
    values.additional_role_ids || [],
  ).filter((roleId) => roleId !== primaryRoleId);

  const payload = {
    full_name: (values.full_name || "").trim(),
    email: (values.email || "").trim().toLowerCase(),
    is_active: values.is_active !== false,
    primary_role_id: primaryRoleId,
    additional_role_ids: additionalRoleIds,
  };

  if (Object.prototype.hasOwnProperty.call(values, "linked_board_member_id")) {
    const boardValue = values.linked_board_member_id;
    logPayloadLinkState("board:present", boardValue);
    if (boardValue === null) {
      payload.linked_board_member_id = null;
    } else if (boardValue !== undefined) {
      payload.linked_board_member_id = String(boardValue).trim() || null;
    }
  } else {
    logPayloadLinkState("board:omitted", undefined);
  }

  if (Object.prototype.hasOwnProperty.call(values, "linked_coach_id")) {
    const coachValue = values.linked_coach_id;
    logPayloadLinkState("coach:present", coachValue);
    if (coachValue === null) {
      payload.linked_coach_id = null;
    } else if (coachValue !== undefined) {
      payload.linked_coach_id = String(coachValue).trim() || null;
    }
  } else {
    logPayloadLinkState("coach:omitted", undefined);
  }

  return payload;
}

export function buildRoleLinksPayload(userId, payload) {
  const links = [];

  if (payload.primary_role_id) {
    links.push({
      user_id: userId,
      role_id: payload.primary_role_id,
      is_primary: true,
    });
  }

  (payload.additional_role_ids || []).forEach((roleId) => {
    if (roleId === payload.primary_role_id) return;
    links.push({ user_id: userId, role_id: roleId, is_primary: false });
  });

  return links;
}
