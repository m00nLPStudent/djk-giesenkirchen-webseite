import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminUsersPageShell from "@/components/admin/users/components/AdminUsersPageShell";
import { getAdminUsersPageData } from "@/components/admin/users/services/users.service";
import { redirect } from "next/navigation";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function AdminUsersPage() {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "users.view" });
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
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
