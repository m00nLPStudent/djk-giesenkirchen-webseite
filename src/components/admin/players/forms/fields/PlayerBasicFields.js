import { FormGrid } from "@/components/admin/forms";
import { InputField, SelectField } from "./FormField";

export default function PlayerBasicFields({
  form,
  errors,
  teamOptions,
  updateField,
  sportContext = "football",
  updateTableTennisTeams,
}) {
  const selectedTeamSeasonIds = Array.isArray(form.team_season_ids)
    ? form.team_season_ids
    : [];
  const additionalTeamSeasonIds = selectedTeamSeasonIds.filter(
    (teamSeasonId) => teamSeasonId !== form.team_season_id,
  );
  const availableAdditionalTeams = teamOptions.filter(
    (teamOption) => !selectedTeamSeasonIds.includes(teamOption.teamSeasonId),
  );

  return (
    <div className="space-y-4">
      <FormGrid>
        <InputField
          label="Vorname"
          required
          placeholder="Vorname"
          value={form.first_name}
          onChange={(event) => updateField("first_name", event.target.value)}
          error={errors.first_name}
        />

        <InputField
          label="Nachname"
          required
          placeholder="Nachname"
          value={form.last_name}
          onChange={(event) => updateField("last_name", event.target.value)}
          error={errors.last_name}
        />
      </FormGrid>

      <FormGrid>
        <SelectField
          label="Mannschaft (optional)"
          value={form.team_season_id}
          onChange={(event) =>
            sportContext === "table_tennis"
              ? updateTableTennisTeams?.({ primaryTeamSeasonId: event.target.value })
              : updateField("team_season_id", event.target.value)
          }
          error={errors.team_season_id}
        >
          <option value="">
            {teamOptions.length > 0
              ? "Keine Mannschaft"
              : "Keine Mannschaft verfügbar"}
          </option>
          {teamOptions.map((teamOption) => (
            <option
              key={teamOption.teamSeasonId}
              value={teamOption.teamSeasonId}
            >
              {teamOption.teamNameDe}
            </option>
          ))}
        </SelectField>

        {sportContext !== "table_tennis" ? (
          <InputField
            label="Rückennummer"
            type="number"
            placeholder="z. B. 10"
            value={form.shirt_number}
            onChange={(event) => updateField("shirt_number", event.target.value)}
          />
        ) : null}
      </FormGrid>

      {sportContext === "table_tennis" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <div>
            <p className="text-sm font-medium text-white">Weitere Mannschaften</p>
            <p className="mt-1 text-xs text-slate-400">
              Der Spieler kann mehreren Tischtennismannschaften der aktuellen Saison angehören.
            </p>
          </div>

          {additionalTeamSeasonIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {additionalTeamSeasonIds.map((teamSeasonId) => {
                const option = teamOptions.find(
                  (teamOption) => teamOption.teamSeasonId === teamSeasonId,
                );
                return (
                  <span
                    key={teamSeasonId}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-100"
                  >
                    {option?.teamNameDe || "Mannschaft"}
                    <button
                      type="button"
                      className="rounded-full px-1 text-slate-400 transition hover:text-white"
                      onClick={() =>
                        updateTableTennisTeams?.({ removeTeamSeasonId: teamSeasonId })
                      }
                      aria-label={`${option?.teamNameDe || "Mannschaft"} entfernen`}
                    >
                      Entfernen
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Keine weitere Mannschaft ausgewählt.</p>
          )}

          <SelectField
            label="Weitere Mannschaft hinzufügen"
            value=""
            onChange={(event) => {
              if (event.target.value) {
                updateTableTennisTeams?.({ addTeamSeasonId: event.target.value });
              }
            }}
          >
            <option value="">
              {availableAdditionalTeams.length
                ? "Mannschaft auswählen"
                : "Keine weitere Mannschaft verfügbar"}
            </option>
            {availableAdditionalTeams.map((teamOption) => (
              <option key={teamOption.teamSeasonId} value={teamOption.teamSeasonId}>
                {teamOption.teamNameDe}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
    </div>
  );
}
