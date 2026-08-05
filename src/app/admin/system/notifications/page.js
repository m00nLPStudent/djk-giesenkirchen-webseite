import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import NotificationMonitoringModule from "@/components/admin/notifications/monitoring/NotificationMonitoringModule";
import { loadNotificationMonitoringSnapshot } from "@/components/admin/notifications/monitoring/notificationMonitoring.loader";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";

export default async function NotificationMonitoringPage({ searchParams }) {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  if (!(auth.roles || []).some((role) => role?.key === "superadmin")) redirect("/admin/unauthorized?reason=superadmin-required");
  const query = await searchParams;
  const filters = { range: query?.range || "seven", status: query?.status || "all", search: query?.search || "" };
  const snapshot = await loadNotificationMonitoringSnapshot(filters);
  return <AdminLayout title="Notification Monitoring" subtitle="System" showHeader={false}><NotificationMonitoringModule initialEntries={JSON.parse(JSON.stringify(snapshot.entries || []))} initialHealth={snapshot.health} initialRecipientAnalysis={snapshot.recipientAnalysis} initialTopErrors={snapshot.topErrors} initialActiveTypes={snapshot.activeTypes} initialFilters={filters} loadError={snapshot.error?.message || null} /></AdminLayout>;
}
