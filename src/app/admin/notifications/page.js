import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import NotificationsModule from "@/components/admin/notifications/NotificationsModule";
import { loadNotifications, markAsRead } from "@/components/admin/notifications/notifications.service";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }) {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  const result = await loadNotifications({ db: auth.supabaseServer, userId: auth.userId, limit: 250 });
  const requestedId = String((await searchParams)?.notification || "");
  const selected = (result.data || []).find((item) => item.id === requestedId) || null;
  if (selected && !selected.isRead) {
    const readResult = await markAsRead({ db: auth.supabaseServer, userId: auth.userId, id: selected.id });
    if (!readResult.error) { selected.isRead = true; selected.readAt = readResult.data?.readAt || new Date().toISOString(); }
  }
  const items = JSON.parse(JSON.stringify(result.error ? [] : result.data));
  return <AdminLayout title="Benachrichtigungen" subtitle="Persönlich" showHeader={false}><NotificationsModule initialItems={items} selectedId={selected?.id || null} /></AdminLayout>;
}
