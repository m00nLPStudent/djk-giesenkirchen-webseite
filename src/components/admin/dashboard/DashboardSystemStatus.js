import Link from "next/link";
import { AlertTriangle, CircleCheck, Info } from "lucide-react";
import DashboardEmptyState from "./DashboardEmptyState";
import AdminPanel from "@/components/admin/common/AdminPanel";
import AdminSectionHeader from "@/components/admin/common/AdminSectionHeader";
import { buildSystemStatusItems } from "./dashboard.helpers";

function StatusItem({ item }) {
  const icon =
    item.level === "warning" ? (
      <AlertTriangle size={18} className="text-yellow-300" />
    ) : item.level === "info" ? (
      <Info size={18} className="text-blue-300" />
    ) : (
      <CircleCheck size={18} className="text-green-300" />
    );

  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-white/75">{item.text}</span>
    </li>
  );
}

export default function DashboardSystemStatus({ statusSignals }) {
  const items = buildSystemStatusItems(statusSignals);

  return (
    <AdminPanel>
      <AdminSectionHeader
        eyebrow="System"
        title="Systemstatus"
        description="Hinweise aus vorhandenen Datenquellen zur Pflege von Inhalten."
        actionLabel="Einstellungen pruefen"
        actionHref="/admin/settings"
      />

      {items.length === 0 ? (
        <div className="mt-5">
          <DashboardEmptyState text="Keine offenen Systemhinweise. Alle geprueften Bereiche sind unauffaellig." />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <StatusItem key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="mt-5 flex justify-end">
        <Link
          href="/admin/settings"
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white/70 transition hover:border-red-500/50 hover:text-white"
        >
          Einstellungen pruefen
        </Link>
      </div>
    </AdminPanel>
  );
}
