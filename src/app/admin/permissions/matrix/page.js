import AdminLayout from "@/components/admin/layout/AdminLayout";
import PermissionMatrix from "@/components/admin/permissions/components/PermissionMatrix";
import { getPermissionMatrixPageData } from "@/components/admin/permissions/services/permissions.service";
import { redirect } from "next/navigation";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export default async function AdminPermissionsMatrixPage() {
  const auth = await assertSuperadminActionPermission({ requiredPermission: "permissions.edit" });
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  const matrixData = await getPermissionMatrixPageData();

  return (
    <AdminLayout
      title="Permissions Matrix"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <PermissionMatrix initialData={matrixData} />
    </AdminLayout>
  );
}
