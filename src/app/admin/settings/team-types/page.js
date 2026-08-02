import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import TeamTypesModule from "@/components/admin/settings/team-types/TeamTypesModule";
import { loadTeamTypes } from "@/components/admin/settings/team-types/teamTypes.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";
export default async function TeamTypesPage() { const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" }); if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission"); const result = await loadTeamTypes(auth.supabaseServer); if (result.error) throw result.error; return <AdminLayout title="Mannschaftsvorlagen" subtitle="Einstellungen" showHeader={false}><TeamTypesModule teamTypes={JSON.parse(JSON.stringify(result.data || []))} /></AdminLayout>; }
