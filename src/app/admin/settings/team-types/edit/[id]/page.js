import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import TeamTypeEditor from "@/components/admin/settings/team-types/TeamTypeEditor";
import { isTeamTypeUsed } from "@/components/admin/settings/team-types/teamTypes.core";
import { loadTeamTypeUsageRows } from "@/components/admin/settings/team-types/teamTypes.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";
export default async function EditTeamTypePage({ params }) { const { id } = await params; const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" }); if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission"); const [templateResult, teamsResult] = await Promise.all([auth.supabaseServer.from("team_templates").select("*").eq("id", id).maybeSingle(), loadTeamTypeUsageRows(auth.supabaseServer)]); if (templateResult.error || !templateResult.data) redirect("/admin/settings/team-types"); if (teamsResult.error) throw teamsResult.error; const template = JSON.parse(JSON.stringify(templateResult.data)); return <AdminLayout title="Mannschaftsvorlage bearbeiten" subtitle="Einstellungen" showHeader={false}><AdminModulePage><TeamTypeEditor initialTeamType={template} isUsed={isTeamTypeUsed(template, teamsResult.data || [])} /></AdminModulePage></AdminLayout>; }
