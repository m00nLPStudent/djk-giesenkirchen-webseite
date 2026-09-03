import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminRolesPageShell from "@/components/admin/roles/components/AdminRolesPageShell";
import { getAdminRolesPageData } from "@/components/admin/roles/services/roles.service";
import { redirect } from "next/navigation";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function AdminRolesPage() {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "roles.view" });
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
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
