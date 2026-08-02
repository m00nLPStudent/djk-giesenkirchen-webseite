import { NextResponse } from "next/server";
import { buildContributionExportCsv } from "@/components/admin/contributions/services/contributionExport.service.js";
import { loadContributionsExportData } from "@/components/admin/contributions/services/contributionUiData.service.js";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";

export const dynamic = "force-dynamic";

function buildFilename() {
  return `vereinsbeitraege-${new Date().toISOString().slice(0, 10)}.csv`;
}

export async function GET(request) {
  const access = await resolveContributionServerContext("contributions.export");

  if (!access.ok) {
    const unauthorizedUrl = new URL(
      "/admin/unauthorized?reason=missing-permission&permission=contributions.export",
      request.url,
    );
    return NextResponse.redirect(unauthorizedUrl);
  }

  const rawSearchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const data = await loadContributionsExportData(access.readClient, rawSearchParams);
  const csv = buildContributionExportCsv(data.contributions);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFilename()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
