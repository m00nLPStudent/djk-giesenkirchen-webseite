import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import SettingsPageEditorView from "@/components/admin/settings/SettingsPageEditorView";
import { loadSettingsEditorRecord } from "@/components/admin/settings/settingsEditorRoute";

export const dynamic = "force-dynamic";
export default async function EditSettingsPage({ params }) { const { id } = await params; const result = await loadSettingsEditorRecord("pages", id); if (!result.ok) redirect(`/admin/unauthorized?reason=${result.reason}`); return <AdminLayout title="Seite bearbeiten" subtitle="Einstellungen" showHeader={false}><AdminModulePage><SettingsPageEditorView initialPage={result.record} /></AdminModulePage></AdminLayout>; }
