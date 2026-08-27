import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import DownloadsModule from "@/components/admin/downloads/DownloadsModule";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadDownloadsAdmin } from "@/components/admin/downloads/downloads.service";

export const dynamic="force-dynamic";
export default async function DownloadsPage(){const auth=await assertAdminActionPermission({requiredPermission:"downloads.view"}); if(!auth.ok)notFound(); const result=await loadDownloadsAdmin(); return <AdminLayout title="Downloads" subtitle="Gesamtverein" showHeader={false}><DownloadsModule downloads={result.downloads||[]} categories={result.categories||[]} loadError={result.ok?null:result.error}/></AdminLayout>;}
