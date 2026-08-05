"use server";
import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { resetOwnNotificationPreferences, setAllOptionalNotificationPreferences, updateOwnNotificationPreference } from "@/components/admin/notifications/preferences/notificationPreferences.service";
async function context() { return assertAdminActionPermission({}); }
const finish = (result) => { if (!result.error) revalidatePath("/admin/notifications/settings"); return { ok: !result.error, message: result.error ? "Einstellung konnte nicht gespeichert werden." : "Einstellung gespeichert." }; };
export async function updateNotificationPreferenceAction(type, enabled) { const auth = await context(); if (!auth.ok) return { ok:false, message:"Keine aktive Admin-Sitzung." }; return finish(await updateOwnNotificationPreference(auth.supabaseServer, auth.userId, String(type), enabled === true)); }
export async function enableAllOptionalNotificationsAction() { const auth = await context(); if (!auth.ok) return { ok:false, message:"Keine aktive Admin-Sitzung." }; return finish(await setAllOptionalNotificationPreferences(auth.supabaseServer, auth.userId, true)); }
export async function disableAllOptionalNotificationsAction() { const auth = await context(); if (!auth.ok) return { ok:false, message:"Keine aktive Admin-Sitzung." }; return finish(await setAllOptionalNotificationPreferences(auth.supabaseServer, auth.userId, false)); }
export async function resetNotificationPreferencesAction() { const auth = await context(); if (!auth.ok) return { ok:false, message:"Keine aktive Admin-Sitzung." }; return finish(await resetOwnNotificationPreferences(auth.supabaseServer, auth.userId)); }
