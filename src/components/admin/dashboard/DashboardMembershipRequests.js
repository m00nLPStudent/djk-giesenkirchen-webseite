import Link from "next/link";
import AdminSelectionList from "@/components/admin/common/AdminSelectionList";
import AdminPanel from "@/components/admin/common/AdminPanel";
import AdminSectionHeader from "@/components/admin/common/AdminSectionHeader";
import {
  getMembershipRequestTypeLabel,
  getMembershipStatusLabel,
} from "@/components/admin/settings/helpers/settingsOptions";
import { formatDateTime } from "./dashboard.helpers";

export default function DashboardMembershipRequests({ requests = [] }) {
  return (
    <AdminPanel>
      <AdminSectionHeader
        eyebrow="Verwaltung"
        title="Offene Mitgliedsanfragen"
        actionLabel="Zu Einstellungen"
        actionHref="/admin/settings"
      />

      <div className="mt-5">
        <AdminSelectionList
          items={requests}
          emptyText="Aktuell sind keine offenen Mitgliedsanfragen vorhanden."
          containerClassName="space-y-3"
          emptyClassName="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55"
          renderItem={(item) => {
            const fullName =
              `${item.first_name || ""} ${item.last_name || ""}`.trim();

            return (
              <Link
                key={item.id}
                href="/admin/settings"
                className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-red-500/40"
              >
                <p className="text-base font-black text-white">
                  {fullName || "Anfrage"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-red-600/20 px-2.5 py-1 font-bold text-red-300">
                    {getMembershipRequestTypeLabel(item.request_type)}
                  </span>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 font-bold text-white/70">
                    {getMembershipStatusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  Eingang: {formatDateTime(item.created_at)}
                </p>
              </Link>
            );
          }}
        />
      </div>
    </AdminPanel>
  );
}
