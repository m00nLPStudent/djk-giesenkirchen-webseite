import Link from "next/link";
import AdminPanel from "@/components/admin/common/AdminPanel";
import { formatContributionAmount } from "../helpers/contributionFormatters.js";

function DashboardMetric({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function ContributionDashboardPanel({ stats }) {
  if (!stats) return null;

  return (
    <AdminPanel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
            Vereinsbeitraege
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Operative Kennzahlen
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Verdichtete Finanzsicht ohne Detaildaten fuer Rollen mit
            Beitragszugriff.
          </p>
        </div>
        <Link
          href="/admin/contributions"
          className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
        >
          Zum Modul
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Offen" value={stats.openCount || 0} />
        <DashboardMetric
          label="Ueberfaellig"
          value={stats.overdueCount || 0}
        />
        <DashboardMetric
          label="Offener Gesamtbetrag"
          value={formatContributionAmount(stats.totalOutstanding)}
        />
        <DashboardMetric
          label="Teilweise bezahlt"
          value={stats.partiallyPaidCount || 0}
        />
      </div>
    </AdminPanel>
  );
}
