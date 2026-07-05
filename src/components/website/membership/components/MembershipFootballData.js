export default function MembershipFootballData({
  showFootballFields,
  teams,
  form,
  derivedYearGroup,
  inputClassName,
  FormField,
  onUpdateField,
}) {
  if (!showFootballFields) return null;

  return (
    <>
      <FormField label="Jahrgang">
        <input className={inputClassName} value={derivedYearGroup} readOnly />
      </FormField>

      <FormField label="Gewünschte Mannschaft optional">
        <select
          className={inputClassName}
          value={form.desired_team_id}
          onChange={(event) =>
            onUpdateField("desired_team_id", event.target.value)
          }
        >
          <option value="">Keine Auswahl</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}
