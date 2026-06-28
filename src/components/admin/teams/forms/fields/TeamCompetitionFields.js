import { FormGrid, InputField } from "@/components/admin/forms";

export default function TeamCompetitionFields({ form, updateField }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Spielplan & Tabelle
        </p>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Für Bambini bis E-Jugend wird nur der Spielplan angezeigt. Ab D-Jugend,
          Damen und Senioren wird zusätzlich die Tabelle eingeblendet, sobald eine
          Tabellen-URL hinterlegt ist.
        </p>
      </div>

      <FormGrid>
        <InputField
          label="fussball.de Team-ID"
          placeholder="Optional"
          value={form.fussball_de_team_id}
          onChange={(event) => updateField("fussball_de_team_id", event.target.value)}
        />

        <InputField
          label="fussball.de Staffel-ID"
          placeholder="Optional"
          value={form.fussball_de_competition_id}
          onChange={(event) => updateField("fussball_de_competition_id", event.target.value)}
        />
      </FormGrid>

      <InputField
        label="fussball.de Vereins-ID"
        placeholder="Optional"
        value={form.fussball_de_club_id}
        onChange={(event) => updateField("fussball_de_club_id", event.target.value)}
      />

      <FormGrid>
        <InputField
          label="Spielplan-Widget URL"
          placeholder="https://..."
          value={form.fussball_de_matches_widget_url}
          onChange={(event) => updateField("fussball_de_matches_widget_url", event.target.value)}
        />

        <InputField
          label="Tabellen-Widget URL"
          placeholder="https://..."
          value={form.fussball_de_table_widget_url}
          onChange={(event) => updateField("fussball_de_table_widget_url", event.target.value)}
        />
      </FormGrid>

      <FormGrid>
        <InputField
          label="DFB Spielplan-Widget URL"
          placeholder="Optional"
          value={form.dfb_matches_widget_url}
          onChange={(event) => updateField("dfb_matches_widget_url", event.target.value)}
        />

        <InputField
          label="DFB Tabellen-Widget URL"
          placeholder="Optional"
          value={form.dfb_table_widget_url}
          onChange={(event) => updateField("dfb_table_widget_url", event.target.value)}
        />
      </FormGrid>
    </div>
  );
}
