import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import TeamTypeEditor from "@/components/admin/settings/team-types/TeamTypeEditor";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadActiveTeamDepartments } from "@/components/admin/teams/services/teamDepartments.repository";

export const dynamic = "force-dynamic";
export default async function NewTeamTypePage() { const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" }); if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission"); const { data: departments } = await loadActiveTeamDepartments(auth.supabaseServer); return <AdminLayout title="Neue Mannschaftsvorlage" subtitle="Einstellungen" showHeader={false}><AdminModulePage><TeamTypeEditor departments={departments || []} /></AdminModulePage></AdminLayout>; }
