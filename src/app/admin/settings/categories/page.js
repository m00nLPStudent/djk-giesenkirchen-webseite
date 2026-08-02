import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import CategoryMasterDataModule from "@/components/admin/settings/categories/CategoryMasterDataModule";
import { loadCategoryMasterData } from "@/components/admin/settings/categories/categoryMasterData.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission");
  const results = await loadCategoryMasterData(auth.supabaseServer);
  const unavailable = Object.values(results).some((result) => result.error);
  const data = Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.data || []]));
  return <AdminLayout title="Kategorien & Terminarten" subtitle="Einstellungen" showHeader={false}><CategoryMasterDataModule initialData={JSON.parse(JSON.stringify(data))} unavailable={unavailable} /></AdminLayout>;
}
