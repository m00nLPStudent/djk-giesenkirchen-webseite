import {
  ErrorText,
  FormGrid,
  FormHintBox,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import { coachLicenses, coachRoles } from "../../constants/CoachOptions";
import { createCoachAssignment } from "../coachForm.helpers";

function updateAssignment(assignments, index, field, value) {
  return assignments.map((assignment, assignmentIndex) =>
    assignmentIndex === index ? { ...assignment, [field]: value } : assignment,
  );
}

function removeAssignment(assignments, index) {
  return assignments.filter((_, assignmentIndex) => assignmentIndex !== index);
}

export default function CoachRoleFields({
  form,
  errors,
  teamOptions = [],
  blockingMessage,
  setForm,
  updateField,
}) {
  const assignments = form.assignments || [];

  return (
    <div className="space-y-6">
      <FormGrid>
        <SelectField
          label="Fallback-Funktion fuer teamlose Trainer"
          required={assignments.length === 0}
          value={form.role}
          onChange={(event) => updateField("role", event.target.value)}
          error={errors.role}
        >
          <option value="">Funktion auswaehlen</option>
          {coachRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Lizenz"
          value={form.license}
          onChange={(event) => updateField("license", event.target.value)}
        >
          {coachLicenses.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </SelectField>
      </FormGrid>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Saisonzuordnungen
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Aktive Zuordnungen der aktuellen Saison mit Rolle je Mannschaft.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Die Fallback-Funktion dient nur fuer teamlose oder historische
              Legacy-Zustaende und wird nicht in aktuelle Zuordnungen kopiert.
            </p>
          </div>

          <button
            type="button"
            disabled={Boolean(blockingMessage) || teamOptions.length === 0}
            onClick={() =>
              setForm((current) => ({
                ...current,
                assignments: [
                  ...(current.assignments || []),
                  createCoachAssignment(),
                ],
              }))
            }
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Zuordnung hinzufuegen
          </button>
        </div>

        {assignments.length === 0 ? (
          <FormHintBox eyebrow="Optional">
            Dieses Trainerprofil kann ohne aktuelle Mannschaft gespeichert werden.
            Lege nur dann Zuordnungen an, wenn der Coach in der aktuellen Saison
            aktiv einer oder mehreren Mannschaften zugeordnet ist.
          </FormHintBox>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <div
                key={assignment.coach_team_season_id || `draft-${index}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white/80">
                    Zuordnung {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        assignments: removeAssignment(
                          current.assignments || [],
                          index,
                        ),
                      }))
                    }
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:border-red-500 hover:text-white"
                  >
                    Entfernen
                  </button>
                </div>

                <FormGrid columns={3}>
                  <SelectField
                    label="Mannschaft"
                    required
                    value={assignment.team_season_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        assignments: updateAssignment(
                          current.assignments || [],
                          index,
                          "team_season_id",
                          event.target.value,
                        ),
                      }))
                    }
                  >
                    <option value="">Mannschaft auswaehlen</option>
                    {teamOptions.map((teamOption) => (
                      <option
                        key={teamOption.teamSeasonId}
                        value={teamOption.teamSeasonId}
                      >
                        {teamOption.teamNameDe}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Rolle"
                    required
                    value={assignment.role_de}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        assignments: updateAssignment(
                          current.assignments || [],
                          index,
                          "role_de",
                          event.target.value,
                        ),
                      }))
                    }
                  >
                    <option value="">Rolle auswaehlen</option>
                    {coachRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </SelectField>

                  <InputField
                    label="Reihenfolge"
                    type="number"
                    value={assignment.assignment_sort_order}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        assignments: updateAssignment(
                          current.assignments || [],
                          index,
                          "assignment_sort_order",
                          event.target.value,
                        ),
                      }))
                    }
                  />
                </FormGrid>
              </div>
            ))}
          </div>
        )}

        <ErrorText error={errors.assignments} />
      </div>
    </div>
  );
}
