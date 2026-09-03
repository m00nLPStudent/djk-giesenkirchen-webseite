import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import TeamTypeEditor from "@/components/admin/settings/team-types/TeamTypeEditor";
import { isTeamTypeUsed } from "@/components/admin/settings/team-types/teamTypes.core";
import { loadTeamTypeUsageRows } from "@/components/admin/settings/team-types/teamTypes.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadActiveTeamDepartments } from "@/components/admin/teams/services/teamDepartments.repository";

export const dynamic = "force-dynamic";
export default async function EditTeamTypePage({ params }) { const { id } = await params; const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" }); if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission"); const [templateResult, teamsResult, departmentsResult] = await Promise.all([auth.supabaseServer.from("team_templates").select("*").eq("id", id).maybeSingle(), loadTeamTypeUsageRows(auth.supabaseServer), loadActiveTeamDepartments(auth.supabaseServer)]); if (templateResult.error || !templateResult.data) redirect("/admin/settings/team-types"); if (teamsResult.error || departmentsResult.error) throw (teamsResult.error || departmentsResult.error); const template = JSON.parse(JSON.stringify(templateResult.data)); return <AdminLayout title="Mannschaftsvorlage bearbeiten" subtitle="Einstellungen" showHeader={false}><AdminModulePage><TeamTypeEditor initialTeamType={template} isUsed={isTeamTypeUsed(template, teamsResult.data || [])} departments={departmentsResult.data || []} /></AdminModulePage></AdminLayout>; }
