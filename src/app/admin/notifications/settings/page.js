import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import NotificationPreferencesModule from "@/components/admin/notifications/preferences/NotificationPreferencesModule";
import { loadOwnNotificationPreferences } from "@/components/admin/notifications/preferences/notificationPreferences.service";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
export const dynamic = "force-dynamic";
export default async function NotificationSettingsPage() { const auth = await assertAdminActionPermission({}); if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`); const result = await loadOwnNotificationPreferences(auth.supabaseServer, auth.userId); return <AdminLayout title="Benachrichtigungseinstellungen" subtitle="Persönlich" showHeader={false}><NotificationPreferencesModule initialItems={result.data || []} setupRequired={Boolean(result.error)} /></AdminLayout>; }
