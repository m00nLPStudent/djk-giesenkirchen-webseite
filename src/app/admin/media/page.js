import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import MediaLibraryModule from "@/components/admin/media-library/MediaLibraryModule";
import { canManageMedia, loadMediaLibrary } from "@/components/admin/media-library/media.service";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }) {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok || !canManageMedia(auth.roles)) redirect("/admin/unauthorized?reason=media-role-required");
  const query = await searchParams;
  const filters = { search: query?.search || "", kind: query?.kind || "all", visibility: query?.visibility || "all", purpose: query?.purpose || "all", archived: query?.archived || "active", sort: query?.sort || "newest", page: 1, pageSize: 100 };
  const result = await loadMediaLibrary(filters);
  return <AdminLayout title="Medienbibliothek" subtitle="Gesamtverein" showHeader={false}><AdminModulePage><AdminModuleHeader eyebrow="Medien" title="Zentrale Medienbibliothek" description="Registrierte Bilder und Dokumente sicher suchen, prüfen und wiederverwenden." /><MediaLibraryModule assets={JSON.parse(JSON.stringify(result.data || []))} filters={filters} error={result.error?.message || null} /></AdminModulePage></AdminLayout>;
}
