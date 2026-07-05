import { FormSection } from "@/components/admin/forms";
import EntityBadge, {
  EntityStatusBadge,
} from "@/components/admin/ui/EntityBadge";
import SettingsSelectionList from "./SettingsSelectionList";

export default function MembershipRecipientList({
  membershipRecipients,
  selectedMembershipRecipientId,
  onSelectRecipient,
  getMembershipRequestTypeLabel,
}) {
  return (
    <FormSection
      eyebrow="Mitglied werden"
      title="Empfänger"
      description="Verwalte, an welche E-Mail-Adressen spätere Mitgliedsanfragen je nach Anfrageart gesendet werden sollen."
    >
      <SettingsSelectionList
        items={membershipRecipients}
        emptyText="Noch keine Empfänger angelegt."
        renderItem={(item) => {
          const active = selectedMembershipRecipientId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRecipient(item)}
              className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <EntityStatusBadge active={item.is_active} />
                <EntityBadge variant="blue">
                  {getMembershipRequestTypeLabel(item.request_type)}
                </EntityBadge>
              </div>
              <p className="mt-3 text-lg font-black">
                {item.label || item.email}
              </p>
              <p className="mt-1 text-sm text-white/60">{item.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                Sortierung {item.sort_order || 0}
              </p>
            </button>
          );
        }}
      />
    </FormSection>
  );
}
