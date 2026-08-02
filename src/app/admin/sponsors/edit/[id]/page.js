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
import { supabase } from "@/lib/supabase";

export default async function EditSponsorPage({ params }) {
  const { id } = await params;
  const [{ data: sponsor }, { data: categories }] = await Promise.all([
    supabase.from("sponsors").select("*").eq("id", id).single(),
    supabase.from("sponsor_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);
  if (!sponsor) notFound();
  const categoryName = (categories || []).find((category) => category.id === sponsor.category_id)?.name_de || "–";
  const websiteHref = getSafeSponsorWebsiteUrl(sponsor.website_url);
  const actions = <AdminActionBar><AdminButton href="#sponsor-editor-form" variant="primary">Bearbeiten</AdminButton>{websiteHref ? <AdminButton href={websiteHref} target="_blank" rel="noopener noreferrer">Website öffnen</AdminButton> : null}</AdminActionBar>;
  const dangerZone = <Can permission="sponsors.delete" uiOnly><AdminDangerZone title="Sponsor dauerhaft löschen" description="Der Sponsor wird dauerhaft aus dem Adminbereich und der öffentlichen Sponsorenanzeige entfernt. Diese Aktion kann nicht rückgängig gemacht werden."><SponsorDeleteButton sponsor={sponsor} /></AdminDangerZone></Can>;

  return <AdminLayout title="Sponsor bearbeiten" subtitle="Sponsoren" showHeader={false}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/sponsors" backLabel="Zurück zu Sponsoren" backVariant="pill" eyebrow="Sponsor" title={sponsor.name} leading={<SponsorLogo src={sponsor.image_url} name={sponsor.name} large />} status={<SponsorStatus sponsor={sponsor} />} meta={`${categoryName} · ${websiteHref ? "Website vorhanden" : "Keine Website"}`} actions={actions} />} dangerZone={dangerZone}><SponsorDetailOverview sponsor={sponsor} categoryName={categoryName} /><AdminSponsorForm sponsor={sponsor} categories={categories || []} /></AdminDetailLayout></AdminLayout>;
}
