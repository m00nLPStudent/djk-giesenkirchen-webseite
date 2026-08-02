import { notFound, redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import BackButton from "@/components/admin/ui/BackButton";
import ContributionForm from "@/components/admin/contributions/forms/ContributionForm";
import { loadContributionById } from "@/components/admin/contributions/repositories/contributionsRead.repository.js";
import { loadContributionFormOptions } from "@/components/admin/contributions/services/contributionUiData.service.js";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";

export const dynamic = "force-dynamic";

export default async function EditContributionPage({ params }) {
  const { id } = await params;
  const access = await resolveContributionServerContext("contributions.edit");

  if (!access.ok) {
    redirect("/admin/unauthorized?reason=missing-permission&permission=contributions.edit");
  }

  const [contribution, formOptions] = await Promise.all([
    loadContributionById(access.readClient, id),
    loadContributionFormOptions(access.readClient),
  ]);

  if (!contribution) {
    notFound();
  }

  return (
    <AdminLayout
      title="Beitrag bearbeiten"
      subtitle="Vereinsbeitraege"
      showHeader={false}
    >
      <div className="space-y-6">
        <BackButton />
        <AdminPageHeader
          eyebrow="Vereinsbeitraege"
          title="Beitrag bearbeiten"
          description="Bearbeitbar bleiben nur die fachlich freigegebenen Stammdaten. Zahlungen, Status und Auditfelder werden nicht direkt veraendert."
        />
        <ContributionForm
          mode="edit"
          contribution={contribution}
          players={formOptions.players}
          seasons={formOptions.seasons}
          currentSeasonId={formOptions.currentSeasonId}
        />
      </div>
    </AdminLayout>
  );
}
