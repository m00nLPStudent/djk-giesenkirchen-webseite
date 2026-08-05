import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AssignedMembershipRequestEditor from "@/components/admin/membership/AssignedMembershipRequestEditor";
import { resolveMembershipRequestRecordAccess } from "@/components/admin/membership/membershipRequestRecordAccess.service";

export const dynamic = "force-dynamic";

export default async function MembershipRequestDetailPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const access = await resolveMembershipRequestRecordAccess(id);
  if (!access.ok) {
    const notificationId = String(query?.notification || "");
    redirect(notificationId ? `/admin/notifications?notification=${encodeURIComponent(notificationId)}` : "/admin/notifications");
  }
  const request = JSON.parse(JSON.stringify(access.request));
  return <AdminLayout title="Mitgliedsanfrage" subtitle="Persönlich zugewiesen" showHeader={false}><AssignedMembershipRequestEditor request={request} assignedOnly={access.isAssignedCoach} notificationId={String(query?.notification || "")} /></AdminLayout>;
}
