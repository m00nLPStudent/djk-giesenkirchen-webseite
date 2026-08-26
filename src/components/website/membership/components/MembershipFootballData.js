export default function MembershipFootballData({
  showFootballFields,
  form,
  resolution,
  inputClassName,
  FormField,
  onUpdateField,
}) {
  if (!showFootballFields) return null;

  return (
    <>
      <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Passende Mannschaft</p>
        {resolution.status === "idle" ? <p className="mt-2 text-sm text-white/55">Nach Eingabe des Geburtsdatums wird die passende Mannschaft ermittelt.</p> : null}
        {resolution.status === "loading" ? <p className="mt-2 text-sm text-white/55">Mannschaft wird ermittelt...</p> : null}
        {resolution.status === "single" ? <p className="mt-2 font-bold text-white">{resolution.options[0]?.name || "Passende Mannschaft"}</p> : null}
        {resolution.status === "multiple" ? <FormField label="Mannschaft auswählen" required><select required className={inputClassName} value={form.desired_team_season_id} onChange={(event) => onUpdateField("desired_team_season_id", event.target.value)}><option value="">Bitte auswählen</option>{resolution.options.map((option) => <option key={option.teamSeasonId} value={option.teamSeasonId}>{option.name}{option.ageGroup ? ` · ${option.ageGroup}` : ""}</option>)}</select></FormField> : null}
        {resolution.status === "none" ? <p className="mt-2 text-sm leading-6 text-white/60">Für diesen Jahrgang ist aktuell keine Mannschaft automatisch hinterlegt. Deine Anfrage kann trotzdem gesendet und anschließend manuell zugeordnet werden.</p> : null}
        {["current_season_missing", "current_season_ambiguous", "football_department_missing", "unavailable"].includes(resolution.status) ? <p className="mt-2 text-sm leading-6 text-white/60">Eine automatische Mannschaftszuordnung ist momentan nicht möglich. Die Anfrage kann trotzdem gesendet werden.</p> : null}
      </div>
    </>
  );
}
