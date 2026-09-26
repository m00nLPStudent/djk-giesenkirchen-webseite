import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import ResultsModule from "@/components/admin/results/ResultsModule";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadResultsAdmin } from "@/components/admin/results/results.service";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "results.view" });
  if (!auth.ok) notFound();
  const result = await loadResultsAdmin(auth);
  return <AdminLayout title="Ergebnisse" subtitle="Fußball und Tischtennis" showHeader={false}><ResultsModule results={result.results || []} teamSeasons={result.teamSeasons || []} departmentSlugs={result.departmentSlugs || []} loadError={result.ok ? null : result.error} /></AdminLayout>;
}
