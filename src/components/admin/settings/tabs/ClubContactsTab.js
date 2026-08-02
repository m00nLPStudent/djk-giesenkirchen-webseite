import Can from "@/components/admin/auth/Can";
import { AdminActionBar, AdminButton, AdminSectionTitle } from "@/components/admin/design-system";
import ContactList from "../components/ContactList";

export default function ClubContactsTab({ contacts, getCategoryLabel }) {
  return <section className="space-y-5"><AdminSectionTitle eyebrow="Kontakte" title="Allgemeine Kontakte" description="Ansprechpartner, Funktionen und öffentliche Kontaktdaten verwalten." actions={<Can permission="settings.edit" uiOnly><AdminActionBar><AdminButton href="/admin/settings/contacts/new" variant="primary">Neuer Kontakt</AdminButton></AdminActionBar></Can>} /><ContactList contacts={contacts} getCategoryLabel={getCategoryLabel} /></section>;
}
