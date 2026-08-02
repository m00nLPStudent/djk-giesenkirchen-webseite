import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import BackButton from "@/components/admin/ui/BackButton";
import ContributionForm from "@/components/admin/contributions/forms/ContributionForm";
import { loadContributionFormOptions } from "@/components/admin/contributions/services/contributionUiData.service.js";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewContributionPage() {
  const access = await resolveContributionServerContext("contributions.create");

  if (!access.ok) {
    redirect("/admin/unauthorized?reason=missing-permission&permission=contributions.create");
  }

  const formOptions = await loadContributionFormOptions(access.readClient);

  return (
    <AdminLayout
      title="Neuer Vereinsbeitrag"
      subtitle="Vereinsbeitraege"
      showHeader={false}
    >
      <div className="space-y-6">
        <BackButton />
        <AdminPageHeader
          eyebrow="Vereinsbeitraege"
          title="Neuen Beitrag anlegen"
          description="Spieler, Saison, Faelligkeit und Betrag werden serverseitig validiert. Finanzsummen entstehen ausschliesslich aus dem Backend-Statusmodell."
        />
        <ContributionForm
          mode="create"
          players={formOptions.players}
          seasons={formOptions.seasons}
          currentSeasonId={formOptions.currentSeasonId}
        />
      </div>
    </AdminLayout>
  );
}
