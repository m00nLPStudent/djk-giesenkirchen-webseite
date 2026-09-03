import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPermissionsPageShell from "@/components/admin/permissions/components/AdminPermissionsPageShell";
import { getAdminPermissionsPageData } from "@/components/admin/permissions/services/permissions.service";
import { redirect } from "next/navigation";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function AdminPermissionsPage() {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "permissions.view" });
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  const initialData = await getAdminPermissionsPageData();

  return (
    <AdminLayout title="Permissions" subtitle="Adminbereich" showHeader={false}>
      <AdminPermissionsPageShell initialData={initialData} />
    </AdminLayout>
  );
}
