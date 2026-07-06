import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminUsersPageShell from "@/components/admin/users/components/AdminUsersPageShell";
import { getAdminUsersPageData } from "@/components/admin/users/services/users.service";

export default async function AdminUsersPage() {
  const data = await getAdminUsersPageData();

  return (
    <AdminLayout
      title="Benutzerverwaltung"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminUsersPageShell initialData={data} />
    </AdminLayout>
  );
}
