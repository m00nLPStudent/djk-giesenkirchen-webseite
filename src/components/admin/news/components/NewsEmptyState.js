import Can from "@/components/admin/auth/Can";
import { AdminButton, AdminModuleEmptyState } from "@/components/admin/design-system";

export default function NewsEmptyState() {
  return (
    <AdminModuleEmptyState title="Keine News gefunden" description="Für die aktuelle Suche oder Filterauswahl sind keine News vorhanden." action={<Can permission="news.create" uiOnly><AdminButton href="/admin/news/new" variant="primary">News erstellen</AdminButton></Can>} />
  );
}
