function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export function buildUserEditorPayload(values = {}) {
  const primaryRoleId = values.primary_role_id || "";
  const additionalRoleIds = uniqueValues(
    values.additional_role_ids || [],
  ).filter((roleId) => roleId !== primaryRoleId);

  return {
    full_name: (values.full_name || "").trim(),
    email: (values.email || "").trim().toLowerCase(),
    is_active: values.is_active !== false,
    primary_role_id: primaryRoleId,
    additional_role_ids: additionalRoleIds,
  };
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
