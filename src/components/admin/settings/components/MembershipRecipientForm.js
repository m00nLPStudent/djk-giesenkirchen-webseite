import {
  FormGrid,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";

export default function MembershipRecipientForm({
  selectedMembershipRecipient,
  membershipRecipientForm,
  membershipRecipientLoading,
  membershipRequestTypeOptions,
  onSubmit,
  onFieldChange,
  onReset,
  onDelete,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection
        eyebrow="Formular"
        title={
          selectedMembershipRecipient
            ? "Empfänger bearbeiten"
            : "Neuer Empfänger"
        }
        description="Diese Daten werden für die spätere Zuordnung und den Mailversand von Mitgliedsanfragen verwendet."
      >
        <FormGrid>
          <InputField
            label="E-Mail"
            type="email"
            required
            value={membershipRecipientForm.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
          />
          <InputField
            label="Label"
            value={membershipRecipientForm.label}
            onChange={(event) => onFieldChange("label", event.target.value)}
          />
          <SelectField
            label="Anfrageart"
            value={membershipRecipientForm.request_type}
            onChange={(event) =>
              onFieldChange("request_type", event.target.value)
            }
          >
            {membershipRequestTypeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Sortierung"
            type="number"
            value={membershipRecipientForm.sort_order}
            onChange={(event) =>
              onFieldChange("sort_order", Number(event.target.value || 0))
            }
          />
        </FormGrid>
        <div className="mt-5">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={membershipRecipientForm.is_active}
              onChange={(event) =>
                onFieldChange("is_active", event.target.checked)
              }
            />
            Aktiv
          </label>
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
        >
          Neuer Empfänger
        </button>
        {selectedMembershipRecipient && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
          >
            Empfänger löschen
          </button>
        )}
        <button
          type="submit"
          disabled={membershipRecipientLoading}
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {membershipRecipientLoading ? "Speichert..." : "Empfänger speichern"}
        </button>
      </div>
    </form>
  );
}
