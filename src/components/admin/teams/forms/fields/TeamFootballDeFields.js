import { FormHintBox, FormValuePreview, TextareaField } from "@/components/admin/forms";
import { parseFootballDeWidgetCode } from "@/lib/football-de";

export default function TeamFootballDeFields({ form, updateField }) {
  function updateMatchesWidget(value) {
    const parsed = parseFootballDeWidgetCode(value);

    updateField("fussball_de_matches_widget_code", value);
    updateField("fussball_de_matches_widget_id", parsed.widgetId);
  }

  function updateTableWidget(value) {
    const parsed = parseFootballDeWidgetCode(value);

    updateField("fussball_de_table_widget_code", value);
    updateField("fussball_de_table_widget_id", parsed.widgetId);
  }

  return (
    <div className="space-y-6">
      <FormHintBox eyebrow="fussball.de Widget-Code">
        Kopiere hier den kompletten Widget-Code aus fussball.de hinein. Gespeichert
        wird automatisch nur die jeweilige Widget-ID.
      </FormHintBox>

      <TextareaField
        label="Spielplan Widget-Code"
        rows={5}
        placeholder="<div class=&quot;fussballde_widget&quot; data-id=&quot;...&quot; data-type=&quot;matches&quot;></div>"
        value={form.fussball_de_matches_widget_code}
        onChange={(event) => updateMatchesWidget(event.target.value)}
      />

      <TextareaField
        label="Tabellen Widget-Code"
        rows={5}
        placeholder="Optional ab D-Jugend, Damen und Senioren"
        value={form.fussball_de_table_widget_code}
        onChange={(event) => updateTableWidget(event.target.value)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormValuePreview label="Spielplan-ID" value={form.fussball_de_matches_widget_id} />
        <FormValuePreview label="Tabellen-ID" value={form.fussball_de_table_widget_id} />
      </div>
    </div>
  );
}
