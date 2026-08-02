import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import MembershipRequestsModule from "@/components/admin/membership/MembershipRequestsModule";
import { loadMembershipRequestsPageData } from "@/components/admin/membership/membershipRequests.loader";

export const dynamic = "force-dynamic";

export default async function MembershipRequestsPage() {
  const result = await loadMembershipRequestsPageData();
  if (!result.ok) redirect(`/admin/unauthorized?reason=${result.reason}`);
  return <AdminLayout title="Mitgliedsanfragen" subtitle="Gesamtverein" showHeader={false}><MembershipRequestsModule initialData={result.data} /></AdminLayout>;
}
