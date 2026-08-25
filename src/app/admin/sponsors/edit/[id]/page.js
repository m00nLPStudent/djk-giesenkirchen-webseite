import { notFound } from "next/navigation";
import Can from "@/components/admin/auth/Can";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout } from "@/components/admin/design-system";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminSponsorForm } from "@/components/admin/sponsors";
import SponsorDetailOverview from "@/components/admin/sponsors/components/SponsorDetailOverview";
import SponsorDeleteButton from "@/components/admin/sponsors/components/SponsorDeleteButton";
import SponsorLogo from "@/components/admin/sponsors/components/SponsorLogo";
import SponsorStatus from "@/components/admin/sponsors/components/SponsorStatus";
import { getSafeSponsorWebsiteUrl } from "@/components/admin/sponsors/sponsorUi.helpers";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canManageMedia, resolveEntityImageMedia } from "@/components/admin/media-library/media.service";

export default async function EditSponsorPage({ params }) {
  const { id } = await params;
  const permission = await assertAdminActionPermission({ requiredPermission: "sponsors.edit" });
  if (!permission.ok) notFound();
  const [{ data: sponsor }, { data: categories }] = await Promise.all([
    permission.supabaseServer.from("sponsors").select("*").eq("id", id).single(),
    permission.supabaseServer.from("sponsor_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  if (!sponsor) notFound();
  const allowed = canManageMedia(permission.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityImageMedia(sponsor.image_media_asset_id, { allowArchived: true, allowedVisibilities: allowed });
  const resolvedLogo = media.data?.previewUrl || sponsor.image_url || null;
  const displaySponsor = { ...sponsor, image_url: resolvedLogo };
  const categoryName = (categories || []).find((category) => category.id === sponsor.category_id)?.name_de || "–";
  const websiteHref = getSafeSponsorWebsiteUrl(sponsor.website_url);
  const actions = <AdminActionBar><AdminButton href="#sponsor-editor-form" variant="primary">Bearbeiten</AdminButton>{websiteHref ? <AdminButton href={websiteHref} target="_blank" rel="noopener noreferrer">Website öffnen</AdminButton> : null}</AdminActionBar>;
  const dangerZone = <Can permission="sponsors.delete" uiOnly><AdminDangerZone title="Sponsor dauerhaft löschen" description="Der Sponsor wird dauerhaft aus dem Adminbereich und der öffentlichen Sponsorenanzeige entfernt. Diese Aktion kann nicht rückgängig gemacht werden."><SponsorDeleteButton sponsor={sponsor} /></AdminDangerZone></Can>;

  return <AdminLayout title="Sponsor bearbeiten" subtitle="Sponsoren" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/sponsors" backLabel="Zurück zu Sponsoren" backVariant="pill" eyebrow="Sponsor" title={sponsor.name} leading={<SponsorLogo src={resolvedLogo} name={sponsor.name} large />} status={<SponsorStatus sponsor={sponsor} />} meta={`${categoryName} · ${websiteHref ? "Website vorhanden" : "Keine Website"}`} actions={actions} />} dangerZone={dangerZone}><SponsorDetailOverview sponsor={displaySponsor} categoryName={categoryName} /><AdminSponsorForm sponsor={sponsor} categories={categories || []} initialMedia={media.data || null} /></AdminDetailLayout></AdminLayout>;
}
