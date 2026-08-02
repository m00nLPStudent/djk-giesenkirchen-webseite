import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModulePage } from "@/components/admin/design-system";
import SettingsPageEditorView from "@/components/admin/settings/SettingsPageEditorView";
import { loadSettingsEditorRecord } from "@/components/admin/settings/settingsEditorRoute";

export const dynamic = "force-dynamic";
export default async function NewSettingsPage() { const result = await loadSettingsEditorRecord("pages"); if (!result.ok) redirect(`/admin/unauthorized?reason=${result.reason}`); return <AdminLayout title="Neue Seite" subtitle="Einstellungen" showHeader={false}><AdminModulePage><SettingsPageEditorView /></AdminModulePage></AdminLayout>; }
