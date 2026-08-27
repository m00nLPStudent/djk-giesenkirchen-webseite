"use server";

import { revalidatePath } from "next/cache";
import { disableAllNotificationEmailTypes, restoreRecommendedNotificationEmailTypes, setNotificationEmailMaster, setNotificationEmailType } from "@/components/admin/notifications/email-settings/notificationEmailSettings.service";

const finish = (result) => {
  if (result.ok) revalidatePath("/admin/system/notification-email-settings");
  return { ok: result.ok, message: result.message || "E-Mail-Einstellung konnte nicht gespeichert werden.", data: result.data || null };
};

export async function updateNotificationEmailMasterAction(enabled) {
  return finish(await setNotificationEmailMaster(enabled === true));
}
export async function updateNotificationEmailTypeAction(type, enabled) {
  return finish(await setNotificationEmailType(type, enabled === true));
}
export async function disableAllNotificationEmailTypesAction() {
  return finish(await disableAllNotificationEmailTypes());
}
export async function restoreRecommendedNotificationEmailTypesAction() {
  return finish(await restoreRecommendedNotificationEmailTypes());
}
