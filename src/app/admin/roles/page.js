import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminRolesPageShell from "@/components/admin/roles/components/AdminRolesPageShell";
import { getAdminRolesPageData } from "@/components/admin/roles/services/roles.service";

export default async function AdminRolesPage() {
  const initialData = await getAdminRolesPageData();

  return (
    <AdminLayout
      title="Rollenverwaltung"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminRolesPageShell initialData={initialData} />
    </AdminLayout>
  );
}
