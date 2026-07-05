import { FormSection } from "@/components/admin/forms";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import SettingsSelectionList from "./SettingsSelectionList";

export default function MembershipRequestList({
  membershipRequests,
  selectedMembershipRequestId,
  onSelectRequest,
  formatRequestDate,
  getMembershipRequestTypeLabel,
  getMembershipStatusLabel,
  getMembershipForwardTypeLabel,
}) {
  return (
    <FormSection
      eyebrow="Mitgliedsanfragen"
      title="Eingegangene Anfragen"
      description="Neueste Anfragen werden zuerst angezeigt. Wähle eine Anfrage, um Status und interne Angaben zu prüfen oder zu aktualisieren."
    >
      <SettingsSelectionList
        items={membershipRequests}
        emptyText="Noch keine Mitgliedsanfragen eingegangen."
        renderItem={(item) => {
          const active = selectedMembershipRequestId === item.id;
          const fullName =
            `${item.first_name || ""} ${item.last_name || ""}`.trim();

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRequest(item)}
              className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <EntityBadge variant="blue">
                  {getMembershipRequestTypeLabel(item.request_type)}
                </EntityBadge>
                <EntityBadge
                  variant={
                    item.status === "done"
                      ? "success"
                      : item.status === "in_progress"
                        ? "warning"
                        : "red"
                  }
                >
                  {getMembershipStatusLabel(item.status)}
                </EntityBadge>
                {item.forwarded_at && (
                  <EntityBadge variant="success">Weitergeleitet</EntityBadge>
                )}
              </div>
              <p className="mt-3 text-lg font-black">{fullName || "Anfrage"}</p>
              <div className="mt-2 space-y-1 text-sm text-white/60">
                <p>Jahrgang: {item.year_group || "-"}</p>
                <p>Mannschaft: {item.teams?.name_de || "-"}</p>
                <p>Telefon: {item.phone || "-"}</p>
                <p>E-Mail: {item.email || "-"}</p>
                <p>Eingang: {formatRequestDate(item.created_at)}</p>
                {item.forwarded_at && (
                  <p>
                    Weitergeleitet an {item.forwarded_to_name || "-"} (
                    {getMembershipForwardTypeLabel(item.forwarded_to_type)})
                  </p>
                )}
              </div>
            </button>
          );
        }}
      />
    </FormSection>
  );
}
