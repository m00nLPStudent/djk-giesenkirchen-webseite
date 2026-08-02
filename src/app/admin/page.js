import AdminLayout from "@/components/admin/layout/AdminLayout";
import DashboardPageShell from "@/components/admin/dashboard/DashboardPageShell";
import { loadDashboard } from "@/components/admin/dashboard/dashboard.loader";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { dashboard, navigation } = await loadDashboard();

  return (
    <AdminLayout navigation={navigation} showHeader={false}>
      <DashboardPageShell dashboard={dashboard} />
    </AdminLayout>
  );
}
