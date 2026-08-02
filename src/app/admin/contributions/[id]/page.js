import { notFound, redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import ContributionDetailClient from "@/components/admin/contributions/components/ContributionDetailClient";
import {
  normalizeContributionDialog,
} from "@/components/admin/contributions/helpers/contributionUiState.js";
import { loadContributionById } from "@/components/admin/contributions/repositories/contributionsRead.repository.js";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";

export const dynamic = "force-dynamic";

export default async function ContributionDetailPage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const access = await resolveContributionServerContext("contributions.view");

  if (!access.ok) {
    redirect("/admin/unauthorized?reason=missing-permission&permission=contributions.view");
  }

  const contribution = await loadContributionById(access.readClient, id);
  if (!contribution) {
    notFound();
  }

  return (
    <AdminLayout
      title="Beitragsdetails"
      subtitle="Vereinsbeitraege"
      showHeader={false}
    >
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <ContributionDetailClient
          contribution={contribution}
          permissionKeys={access.auth.permissions || []}
          initialDialog={normalizeContributionDialog(resolvedSearchParams?.dialog)}
          initialPaymentId={String(resolvedSearchParams?.paymentId || "")}
          notice={String(resolvedSearchParams?.notice || "")}
        />
      </div>
    </AdminLayout>
  );
}
