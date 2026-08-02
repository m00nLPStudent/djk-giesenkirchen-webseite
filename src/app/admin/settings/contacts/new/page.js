import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import SettingsContactEditorView from "@/components/admin/settings/SettingsContactEditorView";
import { loadSettingsEditorRecord } from "@/components/admin/settings/settingsEditorRoute";

export const dynamic = "force-dynamic";
export default async function NewSettingsContact() { const result = await loadSettingsEditorRecord("club_contacts"); if (!result.ok) redirect(`/admin/unauthorized?reason=${result.reason}`); return <AdminLayout title="Neuer Kontakt" subtitle="Einstellungen" showHeader={false}><AdminModulePage><SettingsContactEditorView /></AdminModulePage></AdminLayout>; }
