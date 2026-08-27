import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import NotificationEmailSettingsModule from "@/components/admin/notifications/email-settings/NotificationEmailSettingsModule";
import { loadNotificationEmailSettingsForAdmin } from "@/components/admin/notifications/email-settings/notificationEmailSettings.service";

export const dynamic = "force-dynamic";

export default async function NotificationEmailSettingsPage() {
  const result = await loadNotificationEmailSettingsForAdmin();
  if (!result.ok && ["no-session", "missing-admin-profile", "inactive-user", "superadmin-required"].includes(result.reason)) redirect(`/admin/unauthorized?reason=${result.reason}`);
  return <AdminLayout title="E-Mail-Benachrichtigungen" subtitle="System" showHeader={false}><NotificationEmailSettingsModule initialSettings={result.data} loadError={result.ok ? null : result.message} /></AdminLayout>;
}
