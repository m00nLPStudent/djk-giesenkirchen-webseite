import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
} from "@/components/website/department";
import { supabase } from "@/lib/supabase";
import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { resolveLoadedPublicMediaImage } from "@/lib/people/publicMediaImage.mjs";

function mapClubContactForDisplay(contact = {}, mediaUrls = new Map()) {
  return {
    ...contact,
    name: contact.contact_name,
    image_url: resolveLoadedPublicMediaImage(contact, mediaUrls),
  };
}

export default async function ContactPage() {
  const { data: contacts } = await supabase
    .from("club_contacts")
    .select("*")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const mediaResult = await loadPublicMediaUrlMap((contacts || []).map((contact) => contact.image_media_asset_id));
  return (
    <DepartmentPageLayout
      eyebrow="Kontakt"
      title="Ansprechpartner"
      description="Allgemeine Vereinskontakte wie Webmaster, Jugendschutzbeauftragte oder Ansprechpartner für Verwaltung und Platzanlage."
    >
      <DepartmentPersonGrid emptyText="Noch keine allgemeinen Kontakte veröffentlicht.">
        {(contacts || []).map((contact) => (
          <DepartmentPersonCard
            key={contact.id}
            person={mapClubContactForDisplay(contact, mediaResult.data)}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
