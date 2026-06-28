import { InputField } from "@/components/admin/forms";
import { parseFussballDeTeamLink } from "../teamCompetition.helpers";

export default function TeamCompetitionFields({ form, updateField }) {
  const parsed = parseFussballDeTeamLink(form.fussball_de_team_url);

  function updateTeamLink(value) {
    updateField("fussball_de_team_url", value);
    updateField("fussball_de_team_id", parsed.teamId || form.fussball_de_team_id || "");
    updateField(
      "fussball_de_competition_id",
      parsed.competitionId || form.fussball_de_competition_id || "",
    );
    updateField("fussball_de_club_id", parsed.clubId || form.fussball_de_club_id || "");
    updateField("fussball_de_matches_url", value);
    updateField("fussball_de_table_url", value);
    updateField("fussball_de_matches_widget_url", value);
    updateField("fussball_de_table_widget_url", value);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Automatische Verknüpfung
        </p>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Füge hier den offiziellen fussball.de-Link der Mannschaft ein. Das System
          übernimmt daraus automatisch die Grundlage für Spielplan und Tabelle.
        </p>
      </div>

      <InputField
        label="fussball.de Mannschaftslink"
        placeholder="https://www.fussball.de/mannschaft/..."
        value={form.fussball_de_team_url}
        onChange={(event) => updateTeamLink(event.target.value)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Team-ID
          </p>
          <p className="mt-2 break-all text-sm text-white/70">
            {form.fussball_de_team_id || "Wird automatisch erkannt, falls im Link vorhanden."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Staffel-ID
          </p>
          <p className="mt-2 break-all text-sm text-white/70">
            {form.fussball_de_competition_id || "Wird automatisch erkannt, falls im Link vorhanden."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Vereins-ID
          </p>
          <p className="mt-2 break-all text-sm text-white/70">
            {form.fussball_de_club_id || "Wird automatisch erkannt, falls im Link vorhanden."}
          </p>
        </div>
      </div>
    </div>
  );
}
