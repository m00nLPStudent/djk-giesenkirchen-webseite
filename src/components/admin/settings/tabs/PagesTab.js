import Can from "@/components/admin/auth/Can";
import { AdminActionBar, AdminButton, AdminSectionTitle } from "@/components/admin/design-system";
import PageList from "../components/PageList";

export default function PagesTab({ pages }) {
  return <section className="space-y-5"><AdminSectionTitle eyebrow="CMS" title="Statische Seiten" description="Deutsche Inhalte, Sichtbarkeit und Sortierung verwalten." actions={<Can permission="settings.edit" uiOnly><AdminActionBar><AdminButton href="/admin/settings/pages/new" variant="primary">Neue Seite</AdminButton></AdminActionBar></Can>} /><PageList pages={pages} /></section>;
}
