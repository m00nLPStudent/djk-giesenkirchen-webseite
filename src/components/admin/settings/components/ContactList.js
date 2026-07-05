import { FormSection } from "@/components/admin/forms";
import EntityBadge, {
  EntityStatusBadge,
} from "@/components/admin/ui/EntityBadge";
import SettingsSelectionList from "./SettingsSelectionList";

export default function ContactList({
  contacts,
  selectedContactId,
  onSelectContact,
  getCategoryLabel,
}) {
  return (
    <FormSection
      eyebrow="Kontakte"
      title="Vorhandene Kontakte"
      description="Wähle einen Eintrag zum Bearbeiten oder lege einen neuen Kontakt an."
    >
      <SettingsSelectionList
        items={contacts}
        emptyText="Noch keine allgemeinen Kontakte angelegt."
        renderItem={(contact) => {
          const active = selectedContactId === contact.id;
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelectContact(contact)}
              className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-red-500/70 bg-red-600/10" : "border-white/10 bg-black/20 hover:border-red-500/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <EntityStatusBadge active={contact.is_active} />
                <EntityBadge variant={contact.is_public ? "blue" : "neutral"}>
                  {contact.is_public ? "Öffentlich" : "Intern"}
                </EntityBadge>
              </div>
              <p className="mt-3 text-lg font-black">{contact.role_de}</p>
              <p className="mt-1 text-sm text-white/60">
                {contact.contact_name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                {getCategoryLabel(contact.category)} · Sortierung{" "}
                {contact.sort_order || 0}
              </p>
            </button>
          );
        }}
      />
    </FormSection>
  );
}
