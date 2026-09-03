export const BOARD_GLOBAL_BUSINESS_ROLE = "vorstand";
export const BOARD_DEPARTMENT_ROLE_KEYS = Object.freeze([
  "fussball-vorstand",
  "tischtennis-vorstand",
]);

export const BOARD_OWN_CARD_FIELDS = Object.freeze([
  "first_name",
  "last_name",
  "email",
  "phone",
  "image_media_asset_id",
]);

const BOARD_STRUCTURAL_FIELDS = Object.freeze([
  "admin_profile_id",
  "organization_scope",
  "department_id",
  "role_id",
  "role_de",
  "role_en",
  "is_active",
  "sort_order",
]);

function roleKeys(scopeContext = {}) {
  return new Set((scopeContext.roleKeys || []).filter(Boolean));
}

export function isBoardGlobalBusinessManager(scopeContext = {}) {
  return Boolean(scopeContext.isGlobal || roleKeys(scopeContext).has(BOARD_GLOBAL_BUSINESS_ROLE));
}

export function isBoardDepartmentRole(scopeContext = {}) {
  const roles = roleKeys(scopeContext);
  return BOARD_DEPARTMENT_ROLE_KEYS.some((role) => roles.has(role));
}

export function isOwnBoardCard(scopeContext = {}, boardMember = {}) {
  return Boolean(
    scopeContext.adminProfileId
      && boardMember.admin_profile_id
      && scopeContext.adminProfileId === boardMember.admin_profile_id,
  );
}

export function canAccessBoardMember(scopeContext = {}, boardMember = {}) {
  if (scopeContext.isGlobal) return true;
  if (roleKeys(scopeContext).has(BOARD_GLOBAL_BUSINESS_ROLE)) {
    return ["club", "department"].includes(boardMember.organization_scope);
  }
  return isBoardDepartmentRole(scopeContext) && isOwnBoardCard(scopeContext, boardMember);
}

export function buildOwnBoardCardPayload(payload = {}, existingMember = {}) {
  for (const field of BOARD_STRUCTURAL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)
      && payload[field] !== existingMember[field]) {
      return { ok: false, message: "Strukturelle Felder der Vorstandskachel dürfen nicht geändert werden." };
    }
  }

  return {
    ok: true,
    data: Object.fromEntries(
      BOARD_OWN_CARD_FIELDS
        .filter((field) => Object.prototype.hasOwnProperty.call(payload, field))
        .map((field) => [field, payload[field]]),
    ),
  };
}
