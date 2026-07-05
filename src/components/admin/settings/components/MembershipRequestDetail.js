import {
  FormGrid,
  FormHintBox,
  FormSection,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import SectionHeader from "./SectionHeader";

export default function MembershipRequestDetail({
  selectedMembershipRequest,
  membershipRequestForm,
  membershipRequestLoading,
  forwardingTargets,
  membershipStatusOptions,
  membershipForwardTypeOptions,
  onSubmit,
  onFieldChange,
  onForward,
  onMarkDone,
  formatRequestDate,
  getMembershipForwardTypeLabel,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection
        eyebrow="Anfrage"
        title={
          selectedMembershipRequest ? "Anfrage bearbeiten" : "Anfrage auswählen"
        }
        description="Status aktualisieren, komplette Anfrage lesen und später interne Notizen ergänzen."
      >
        {!selectedMembershipRequest && (
          <p className="text-sm text-white/55">Wähle links eine Anfrage aus.</p>
        )}

        {selectedMembershipRequest && (
          <>
            <FormGrid>
              <InputField
                label="Vorname"
                value={selectedMembershipRequest.first_name || ""}
                readOnly
              />
              <InputField
                label="Nachname"
                value={selectedMembershipRequest.last_name || ""}
                readOnly
              />
              <InputField
                label="Telefon"
                value={selectedMembershipRequest.phone || ""}
                readOnly
              />
              <InputField
                label="E-Mail"
                value={selectedMembershipRequest.email || ""}
                readOnly
              />
              <InputField
                label="Jahrgang"
                value={selectedMembershipRequest.year_group || ""}
                readOnly
              />
              <InputField
                label="Gewünschte Mannschaft"
                value={selectedMembershipRequest.teams?.name_de || ""}
                readOnly
              />
            </FormGrid>

            <div className="mt-5">
              <SelectField
                label="Status"
                value={membershipRequestForm.status}
                onChange={(event) =>
                  onFieldChange("status", event.target.value)
                }
              >
                {membershipStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
              <SectionHeader
                eyebrow="Weiterleiten an"
                title="Trainer oder Vorstand auswählen"
                description="Die Anfrage wird nur in membership_requests dokumentiert. Ein echter Mailversand folgt später."
                right={
                  selectedMembershipRequest.forwarded_at ? (
                    <EntityBadge variant="success">
                      Weitergeleitet am{" "}
                      {formatRequestDate(
                        selectedMembershipRequest.forwarded_at,
                      )}
                    </EntityBadge>
                  ) : null
                }
              />

              <div className="mt-5">
                <FormGrid>
                  <SelectField
                    label="Auswahltyp"
                    value={membershipRequestForm.forwarded_to_type}
                    onChange={(event) =>
                      onFieldChange("forwarded_to_type", event.target.value)
                    }
                  >
                    <option value="">Bitte wählen</option>
                    {membershipForwardTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Person"
                    value={membershipRequestForm.forwarded_to_id}
                    onChange={(event) =>
                      onFieldChange("forwarded_to_id", event.target.value)
                    }
                    disabled={!membershipRequestForm.forwarded_to_type}
                  >
                    <option value="">
                      {membershipRequestForm.forwarded_to_type
                        ? "Person auswählen"
                        : "Bitte zuerst Typ wählen"}
                    </option>
                    {forwardingTargets.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </FormGrid>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Weiterleitungsnotiz
                </label>
                <textarea
                  rows={4}
                  value={membershipRequestForm.forwarded_note}
                  onChange={(event) =>
                    onFieldChange("forwarded_note", event.target.value)
                  }
                  placeholder="Optionaler Hinweis für spätere Übergabe oder Mail"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500"
                />
              </div>

              {selectedMembershipRequest.forwarded_at && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <p>
                    Aktuelle Weiterleitung:{" "}
                    {selectedMembershipRequest.forwarded_to_name || "-"} (
                    {getMembershipForwardTypeLabel(
                      selectedMembershipRequest.forwarded_to_type,
                    )}
                    )
                  </p>
                  <p className="mt-1">
                    E-Mail:{" "}
                    {selectedMembershipRequest.forwarded_to_email || "-"}
                  </p>
                  <p className="mt-1">
                    Notiz: {selectedMembershipRequest.forwarded_note || "-"}
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onForward}
                  disabled={membershipRequestLoading}
                  className="rounded-full border border-red-500/60 px-6 py-3 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  {membershipRequestLoading
                    ? "Leitet weiter..."
                    : "Weiterleiten"}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Nachricht
              </label>
              <textarea
                rows={6}
                value={selectedMembershipRequest.message || ""}
                readOnly
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 outline-none"
              />
            </div>

            {Object.prototype.hasOwnProperty.call(
              selectedMembershipRequest,
              "internal_note",
            ) ? (
              <div className="mt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Interne Notiz
                </label>
                <textarea
                  rows={5}
                  value={membershipRequestForm.internal_note}
                  onChange={(event) =>
                    onFieldChange("internal_note", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500"
                />
              </div>
            ) : (
              <FormHintBox eyebrow="Hinweis">
                Interne Notizen werden verfügbar, sobald die vorbereitete
                SQL-Migration für membership_requests angewendet wurde.
              </FormHintBox>
            )}
          </>
        )}
      </FormSection>

      {selectedMembershipRequest && (
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onMarkDone}
            disabled={membershipRequestLoading}
            className="rounded-full border border-green-500/60 px-6 py-3 text-sm font-bold text-green-300 transition hover:bg-green-600 hover:text-white disabled:opacity-50"
          >
            Als erledigt markieren
          </button>
          <button
            type="submit"
            disabled={membershipRequestLoading}
            className="rounded-full bg-red-600 px-8 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {membershipRequestLoading ? "Speichert..." : "Anfrage speichern"}
          </button>
        </div>
      )}
    </form>
  );
}
