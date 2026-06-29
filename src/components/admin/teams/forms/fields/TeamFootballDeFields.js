import { TextareaField } from "@/components/admin/forms";
import { parseFootballDeWidgetCode } from "@/lib/football-de";

function WidgetPreview({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm text-white/70">
        {value || "Noch nicht erkannt."}
      </p>
    </div>
  );
}

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
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          fussball.de Widget-Code
        </p>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Kopiere hier den kompletten Widget-Code aus fussball.de hinein. Gespeichert
          wird automatisch nur die jeweilige Widget-ID.
        </p>
      </div>

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
        <WidgetPreview label="Spielplan-ID" value={form.fussball_de_matches_widget_id} />
        <WidgetPreview label="Tabellen-ID" value={form.fussball_de_table_widget_id} />
      </div>
    </div>
  );
}
