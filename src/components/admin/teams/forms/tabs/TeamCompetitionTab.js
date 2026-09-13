"use client";

import { useState } from "react";
import { saveTeamCompetitionConfigAction } from "@/app/admin/teams/actions";
import { FormAlert, FormSection, InputField } from "@/components/admin/forms";
import TeamFootballDeFields from "../fields/TeamFootballDeFields";

const EMPTY = { association: "", external_season_key: "", external_group_id: "", league_slug: "", external_team_id: "", is_active: true };

export default function TeamCompetitionTab({ form, onFieldChange, departmentSlug = null, teamId = null, initialCompetitionConfigsByTeamSeasonId = {} }) {
  const [config, setConfig] = useState(() => ({ ...EMPTY, ...(initialCompetitionConfigsByTeamSeasonId[form.team_season_id] || {}) }));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);
  async function saveConfig() { setPending(true); setMessage(null); const result = await saveTeamCompetitionConfigAction(teamId, form.team_season_id, config); setPending(false); setMessage(result.error ? { tone: "error", text: result.error.message } : { tone: "success", text: "click-TT-Konfiguration gespeichert." }); }
  if (departmentSlug === "tischtennis") {
    return <FormSection eyebrow="Spielbetrieb" title="click-TT / myTischtennis" description="Externe Zuordnung für die ausgewählte Mannschaftssaison. Der Providerhost ist fest vorgegeben."><div className="space-y-5">
      {!form.team_season_id ? <FormAlert tone="warning">Für die ausgewählte Saison existiert noch keine Mannschaftssaison.</FormAlert> : null}
      {message ? <FormAlert tone={message.tone}>{message.text}</FormAlert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Provider" value="click-TT / myTischtennis" disabled />
        <InputField label="Verband / Association" value={config.association} maxLength={16} placeholder="WTTV" onChange={(event) => setConfig((value) => ({ ...value, association: event.target.value }))} />
        <InputField label="Externe Saison" value={config.external_season_key} maxLength={6} placeholder="26--27" onChange={(event) => setConfig((value) => ({ ...value, external_season_key: event.target.value }))} />
        <InputField label="Gruppen-ID" value={config.external_group_id} maxLength={20} inputMode="numeric" onChange={(event) => setConfig((value) => ({ ...value, external_group_id: event.target.value }))} />
        <InputField label="Liga-Slug" value={config.league_slug} maxLength={160} onChange={(event) => setConfig((value) => ({ ...value, league_slug: event.target.value }))} />
        <InputField label="Externe Team-ID" value={config.external_team_id} maxLength={20} inputMode="numeric" onChange={(event) => setConfig((value) => ({ ...value, external_team_id: event.target.value }))} />
      </div>
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={config.is_active} onChange={(event) => setConfig((value) => ({ ...value, is_active: event.target.checked }))} className="h-5 w-5 accent-red-500" />Integration aktiv</label>
      <button type="button" disabled={pending || !teamId || !form.team_season_id} onClick={saveConfig} className="min-h-11 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Wird gespeichert …" : "click-TT-Konfiguration speichern"}</button>
    </div></FormSection>;
  }
  return (
    <FormSection
      eyebrow="Spielbetrieb"
      title="fussball.de Integration"
      description="Widget-Code aus fussball.de einfügen. Gespeichert werden automatisch nur die Widget-IDs."
    >
      <TeamFootballDeFields form={form} updateField={onFieldChange} teamId={teamId} teamSeasonId={form.team_season_id} />
    </FormSection>
  );
}
