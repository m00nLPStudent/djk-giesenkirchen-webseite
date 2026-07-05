import {
  DepartmentPageLayout,
  DepartmentPersonCard,
  DepartmentPersonGrid,
} from "@/components/website/department";
import { supabase } from "@/lib/supabase";

function mapClubContactForDisplay(contact = {}) {
  return {
    ...contact,
    name: contact.contact_name,
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
            person={mapClubContactForDisplay(contact)}
          />
        ))}
      </DepartmentPersonGrid>
    </DepartmentPageLayout>
  );
}
