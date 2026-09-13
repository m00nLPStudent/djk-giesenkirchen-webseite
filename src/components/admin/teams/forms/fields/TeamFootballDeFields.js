"use client";

import { useState } from "react";
import { removeFootballDeWidgetAction, saveFootballDeWidgetAction } from "@/app/admin/teams/actions";
import { FormAlert, FormHintBox, FormValuePreview, TextareaField } from "@/components/admin/forms";

export default function TeamFootballDeFields({ form, updateField, teamId, teamSeasonId }) {
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState(null);
  async function save(kind) {
    setPending(kind);
    setMessage(null);
    const field = kind === "matches" ? "fussball_de_matches_widget_code" : "fussball_de_table_widget_code";
    const idField = kind === "matches" ? "fussball_de_matches_widget_id" : "fussball_de_table_widget_id";
    const result = await saveFootballDeWidgetAction(teamId, teamSeasonId, kind, form[field]);
    if (!result.error) {
      updateField(idField, result.data.widgetId);
      updateField(field, "");
    }
    setMessage(result.error ? { tone: "error", text: result.error.message } : { tone: "success", text: `${kind === "matches" ? "Spielplan" : "Tabelle"} gespeichert.` });
    setPending(null);
  }

  async function remove(kind) {
    setPending(kind);
    setMessage(null);
    const idField = kind === "matches" ? "fussball_de_matches_widget_id" : "fussball_de_table_widget_id";
    const result = await removeFootballDeWidgetAction(teamId, teamSeasonId, kind);
    if (!result.error) updateField(idField, "");
    setMessage(result.error ? { tone: "error", text: result.error.message } : { tone: "success", text: `${kind === "matches" ? "Spielplan" : "Tabelle"} entfernt.` });
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <FormHintBox eyebrow="fussball.de Widget-Code">
        Kopiere hier den kompletten Widget-Code aus fussball.de hinein. Gespeichert
        wird automatisch nur die jeweilige Widget-ID.
      </FormHintBox>
      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}

      <TextareaField
        label="Spielplan Widget-Code"
        rows={5}
        placeholder="<div class=&quot;fussballde_widget&quot; data-id=&quot;...&quot; data-type=&quot;team-matches&quot;></div>"
        value={form.fussball_de_matches_widget_code}
        onChange={(event) => updateField("fussball_de_matches_widget_code", event.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={Boolean(pending) || !teamId || !teamSeasonId || !form.fussball_de_matches_widget_code.trim()} onClick={() => save("matches")} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-black disabled:opacity-45">{form.fussball_de_matches_widget_id ? "Spielplan ersetzen" : "Spielplan speichern"}</button>
        <button type="button" disabled={Boolean(pending) || !form.fussball_de_matches_widget_id} onClick={() => remove("matches")} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-black disabled:opacity-45">Spielplan entfernen</button>
      </div>

      <TextareaField
        label="Tabellen Widget-Code"
        rows={5}
        placeholder="Optional ab D-Jugend, Damen und Senioren"
        value={form.fussball_de_table_widget_code}
        onChange={(event) => updateField("fussball_de_table_widget_code", event.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={Boolean(pending) || !teamId || !teamSeasonId || !form.fussball_de_table_widget_code.trim()} onClick={() => save("table")} className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-black disabled:opacity-45">{form.fussball_de_table_widget_id ? "Tabelle ersetzen" : "Tabelle speichern"}</button>
        <button type="button" disabled={Boolean(pending) || !form.fussball_de_table_widget_id} onClick={() => remove("table")} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-black disabled:opacity-45">Tabelle entfernen</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormValuePreview label="Spielplan-ID" value={form.fussball_de_matches_widget_id} />
        <FormValuePreview label="Tabellen-ID" value={form.fussball_de_table_widget_id} />
      </div>
    </div>
  );
}
