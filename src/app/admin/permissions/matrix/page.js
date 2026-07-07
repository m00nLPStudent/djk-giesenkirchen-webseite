import AdminLayout from "@/components/admin/layout/AdminLayout";
import PermissionMatrix from "@/components/admin/permissions/components/PermissionMatrix";
import { getPermissionMatrixPageData } from "@/components/admin/permissions/services/permissions.service";

export default async function AdminPermissionsMatrixPage() {
  const matrixData = await getPermissionMatrixPageData();

  return (
    <AdminLayout title="Permissions Matrix" subtitle="Adminbereich" showHeader={false}>
      <PermissionMatrix initialData={matrixData} />
    </AdminLayout>
  );
}
