import {
  ErrorText,
  FieldLabel,
  FormGrid,
  InputField,
  SelectField,
} from "@/components/admin/forms";
import { CONTRIBUTION_NATIVE_SELECT_CLASSNAME } from "../helpers/contributionSelectStyles.js";
import { CONTRIBUTION_KEY_OPTIONS } from "../helpers/contributionOptions.js";

export function FormGroup({ title, description, children }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/55">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function TeamSnapshotField({
  value,
  options,
  error,
  disabled,
  helpText,
  placeholderLabel,
  onChange,
}) {
  return (
    <div>
      <FieldLabel>Mannschaftssnapshot</FieldLabel>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-14 w-full rounded-2xl border bg-[#17171d] px-4 text-white outline-none ${
          error ? "border-red-500" : "border-white/10 focus:border-red-500"
        } ${CONTRIBUTION_NATIVE_SELECT_CLASSNAME}`}
      >
        <option value="">{placeholderLabel}</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-white/55">{helpText}</p>
      <ErrorText error={error} />
    </div>
  );
}

export function ContributionIdentityFields({
  playerSearch,
  onPlayerSearchChange,
  visiblePlayers,
  form,
  onPlayerChange,
  onSeasonChange,
  seasons,
  errors,
  isLocked,
  teamSnapshotOptions,
  snapshotState,
  onTeamSnapshotChange,
}) {
  return (
    <FormGroup
      title="Spieler, Saison und Snapshot"
      description="Die Mannschaft wird aus der saisonalen Zuordnung des ausgewaehlten Spielers vorbereitet."
    >
      <FormGrid>
        <InputField
          label="Spieler suchen"
          value={playerSearch}
          onChange={(event) => onPlayerSearchChange(event.target.value)}
          placeholder="Name filtern"
          disabled={isLocked}
        />
        <SelectField
          label="Spieler"
          required
          value={form.playerId}
          onChange={(event) => onPlayerChange(event.target.value)}
          error={errors.playerId}
          disabled={isLocked}
          className={CONTRIBUTION_NATIVE_SELECT_CLASSNAME}
        >
          <option value="">Spieler auswaehlen</option>
          {visiblePlayers.map((player) => (
            <option key={player.value} value={player.value}>
              {player.label}
              {player.isActive ? "" : " (inaktiv)"}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Saison"
          required
          value={form.seasonId}
          onChange={(event) => onSeasonChange(event.target.value)}
          error={errors.seasonId}
          disabled={isLocked}
          className={CONTRIBUTION_NATIVE_SELECT_CLASSNAME}
        >
          <option value="">Saison auswaehlen</option>
          {seasons.map((season) => (
            <option key={season.value} value={season.value}>
              {season.label}
            </option>
          ))}
        </SelectField>
        <TeamSnapshotField
          value={form.teamSnapshotName}
          options={teamSnapshotOptions}
          error={errors.teamSnapshotName}
          disabled={isLocked}
          helpText={snapshotState.helpText}
          placeholderLabel={snapshotState.placeholderLabel}
          onChange={(event) => onTeamSnapshotChange(event.target.value)}
        />
      </FormGrid>
    </FormGroup>
  );
}

export function ContributionMetaFields({
  form,
  onContributionKeyChange,
  onTitleChange,
  onAmountDueChange,
  onDueDateChange,
  errors,
  isLocked,
}) {
  return (
    <FormGroup
      title="Beitragstyp und Eckdaten"
      description="Der Titel wird beim Beitragstypwechsel sinnvoll vorbelegt, bleibt aber jederzeit editierbar."
    >
      <FormGrid>
        <SelectField
          label="Beitragstyp"
          required
          value={form.contributionKey}
          onChange={(event) => onContributionKeyChange(event.target.value)}
          error={errors.contributionKey}
          disabled={isLocked}
          className={CONTRIBUTION_NATIVE_SELECT_CLASSNAME}
        >
          {CONTRIBUTION_KEY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Titel"
          required
          value={form.title}
          onChange={(event) => onTitleChange(event.target.value)}
          error={errors.title}
          disabled={isLocked}
        />
        <InputField
          label="Sollbetrag"
          required
          value={form.amountDue}
          onChange={(event) => onAmountDueChange(event.target.value)}
          error={errors.amountDue}
          placeholder="z. B. 120,00"
          disabled={isLocked}
        />
        <InputField
          label="Faelligkeitsdatum"
          required
          type="date"
          value={form.dueDate}
          onChange={(event) => onDueDateChange(event.target.value)}
          error={errors.dueDate}
          disabled={isLocked}
        />
      </FormGrid>
    </FormGroup>
  );
}
