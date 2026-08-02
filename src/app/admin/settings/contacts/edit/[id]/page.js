import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import SettingsContactEditorView from "@/components/admin/settings/SettingsContactEditorView";
import { loadSettingsEditorRecord } from "@/components/admin/settings/settingsEditorRoute";

export const dynamic = "force-dynamic";
export default async function EditSettingsContact({ params }) { const { id } = await params; const result = await loadSettingsEditorRecord("club_contacts", id); if (!result.ok) redirect(`/admin/unauthorized?reason=${result.reason}`); return <AdminLayout title="Kontakt bearbeiten" subtitle="Einstellungen" showHeader={false}><AdminModulePage><SettingsContactEditorView initialContact={result.record} /></AdminModulePage></AdminLayout>; }
