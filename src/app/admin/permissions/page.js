import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPermissionsPageShell from "@/components/admin/permissions/components/AdminPermissionsPageShell";
import { getAdminPermissionsPageData } from "@/components/admin/permissions/services/permissions.service";

export default async function AdminPermissionsPage() {
  const initialData = await getAdminPermissionsPageData();

  return (
    <AdminLayout title="Permissions" subtitle="Adminbereich" showHeader={false}>
      <AdminPermissionsPageShell initialData={initialData} />
    </AdminLayout>
  );
}
