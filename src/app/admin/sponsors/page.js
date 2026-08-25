import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorList } from "@/components/admin/sponsors";
import { supabase } from "@/lib/supabase";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canManageMedia, loadMediaUrlMap } from "@/components/admin/media-library/media.service";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  const permission = await assertAdminActionPermission({ requiredPermission: "sponsors.view" });
  const db = permission.ok ? permission.supabaseServer : supabase;
  const { data: sponsors } = await db.from("sponsors").select("*, sponsor_categories(name_de)").order("sort_order", { ascending: true });
  const allowed = permission.ok && canManageMedia(permission.roles) ? ["public", "admin"] : ["public"];
  const media = await loadMediaUrlMap((sponsors || []).map((sponsor) => sponsor.image_media_asset_id), allowed);
  const resolved = (sponsors || []).map((sponsor) => ({ ...sponsor, image_url: media.data.get(sponsor.image_media_asset_id) || sponsor.image_url || null }));
  return <AdminLayout title="Sponsoren" subtitle="Adminbereich" showHeader={false}><AdminSponsorList sponsors={resolved} /></AdminLayout>;
}
