import { TextareaField } from "@/components/admin/forms";
import { parseFupaWidgetCode } from "@/lib/fupa";

function WidgetPreview({ label, widgetId }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm text-white/70">
        {widgetId || "Noch keine Widget-ID erkannt."}
      </p>
    </div>
  );
}

export default function TeamFupaFields({ form, updateField }) {
  function updateMatchesWidget(value) {
    const parsed = parseFupaWidgetCode(value);

    updateField("fupa_matches_widget_code", value);
    updateField("fupa_matches_widget_id", parsed.widgetId);

    if (parsed.clubUrl) {
      updateField("fupa_club_url", parsed.clubUrl);
    }
  }

  function updateTableWidget(value) {
    const parsed = parseFupaWidgetCode(value);

    updateField("fupa_table_widget_code", value);
    updateField("fupa_table_widget_id", parsed.widgetId);

    if (parsed.clubUrl) {
      updateField("fupa_club_url", parsed.clubUrl);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          FuPa Widget-Code
        </p>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Kopiere hier den kompletten Widget-Code aus dem FuPa Widget-Builder hinein.
          Das Design wird zentral für alle Mannschaften über die Webseite gesteuert.
        </p>
      </div>

      <TextareaField
        label="Spielplan Widget-Code"
        rows={5}
        placeholder="<div id=&quot;fp-widget_root-...&quot;>...</div>"
        value={form.fupa_matches_widget_code}
        onChange={(event) => updateMatchesWidget(event.target.value)}
      />

      <TextareaField
        label="Tabellen Widget-Code"
        rows={5}
        placeholder="Optional ab D-Jugend, Damen und Senioren"
        value={form.fupa_table_widget_code}
        onChange={(event) => updateTableWidget(event.target.value)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <WidgetPreview label="Spielplan-ID" widgetId={form.fupa_matches_widget_id} />
        <WidgetPreview label="Tabellen-ID" widgetId={form.fupa_table_widget_id} />
        <WidgetPreview label="FuPa Vereinslink" widgetId={form.fupa_club_url} />
      </div>
    </div>
  );
}
