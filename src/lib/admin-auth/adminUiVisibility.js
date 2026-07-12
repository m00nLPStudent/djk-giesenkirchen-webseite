import { hasPermission } from "./permissionEngine";

export function getAdminUiRequiredPermission(itemOrPermission) {
  if (!itemOrPermission) return null;

  if (typeof itemOrPermission === "string") {
    return itemOrPermission;
  }

  return (
    itemOrPermission.requiredPermission || itemOrPermission.permission || null
  );
}

export function canRenderAdminUiItem(userContext, itemOrPermission) {
  const requiredPermission = getAdminUiRequiredPermission(itemOrPermission);

  if (!requiredPermission) {
    return true;
  }

  return hasPermission(userContext, requiredPermission);
}

export function filterVisibleAdminUiItems(userContext, items = []) {
  return items.filter((item) => canRenderAdminUiItem(userContext, item));
}

export function hasVisibleAdminUiItems(userContext, items = []) {
  return items.some((item) => canRenderAdminUiItem(userContext, item));
}
