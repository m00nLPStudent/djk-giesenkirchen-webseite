import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import TeamTypeEditor from "@/components/admin/settings/team-types/TeamTypeEditor";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";
export default async function NewTeamTypePage() { const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" }); if (!auth.ok) redirect("/admin/unauthorized?reason=missing-settings-edit-permission"); return <AdminLayout title="Neue Mannschaftsvorlage" subtitle="Einstellungen" showHeader={false}><AdminModulePage><TeamTypeEditor /></AdminModulePage></AdminLayout>; }
