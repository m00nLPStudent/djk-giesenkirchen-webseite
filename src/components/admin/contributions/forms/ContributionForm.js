"use client";

import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  FormActions,
  FormAlert,
  FormSection,
  TextareaField,
} from "@/components/admin/forms";
import {
  createContributionAction,
  updateContributionAction,
} from "@/app/admin/contributions/actions";
import {
  getContributionSnapshotFieldState,
} from "../helpers/contributionTeamAssignments.js";
import { buildInitialContributionForm, buildContributionPayload } from "../helpers/contributionFormState.js";
import { getContributionStatusLabel } from "../helpers/contributionFormatters.js";
import {
  isContributionTitleCustomized,
  resolveContributionTitleChange,
} from "../helpers/contributionTitleDefaults.js";
import {
  ContributionIdentityFields,
  ContributionMetaFields,
} from "./ContributionFormFields.js";

function buildSnapshotOptions(snapshotState, currentValue = "") {
  const options = [...(snapshotState.options || [])];

  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({
      value: currentValue,
      label: currentValue,
    });
  }

  return options;
}

export default function ContributionForm({
  mode = "create",
  contribution = null,
  players = [],
  seasons = [],
  currentSeasonId = "",
}) {
  const router = useRouter();
  const initialForm = useMemo(
    () => buildInitialContributionForm(contribution, currentSeasonId),
    [contribution, currentSeasonId],
  );
  const [form, setForm] = useState(initialForm);
  const [playerSearch, setPlayerSearch] = useState("");
  const deferredPlayerSearch = useDeferredValue(playerSearch);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snapshotNotice, setSnapshotNotice] = useState("");
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(
    mode === "edit" && Boolean(contribution?.title),
  );
  const isEdit = mode === "edit";
  const isLocked =
    contribution?.status === "canceled" || contribution?.status === "exempt";

  const selectedPlayer = useMemo(
    () => players.find((player) => player.value === form.playerId) || null,
    [form.playerId, players],
  );
  const snapshotState = useMemo(
    () =>
      getContributionSnapshotFieldState({
        playerOption: selectedPlayer,
        seasonId: form.seasonId,
        currentSeasonId,
      }),
    [currentSeasonId, form.seasonId, selectedPlayer],
  );
  const teamSnapshotOptions = useMemo(
    () => buildSnapshotOptions(snapshotState, form.teamSnapshotName),
    [form.teamSnapshotName, snapshotState],
  );
  const visiblePlayers = useMemo(() => {
    const normalizedSearch = deferredPlayerSearch.trim().toLowerCase();
    if (!normalizedSearch) return players;

    return (players || []).filter((player) =>
      String(player.displayName || player.label || "")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [deferredPlayerSearch, players]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
    setMessage("");
  }

  function applyIdentityChange(nextPlayerId, nextSeasonId) {
    const nextPlayer =
      players.find((player) => player.value === nextPlayerId) || null;
    const nextSnapshotState = getContributionSnapshotFieldState({
      playerOption: nextPlayer,
      seasonId: nextSeasonId,
      currentSeasonId,
    });

    setSnapshotNotice(nextSnapshotState.notice || "");
    setForm((current) => ({
      ...current,
      playerId: nextPlayerId,
      seasonId: nextSeasonId,
      teamSnapshotName: nextSnapshotState.defaultValue,
    }));
    setErrors((current) => ({
      ...current,
      playerId: null,
      seasonId: null,
      teamSnapshotName: null,
    }));
    setMessage("");
  }

  function handleContributionKeyChange(nextContributionKey) {
    const titleState = resolveContributionTitleChange({
      currentTitle: form.title,
      previousContributionKey: form.contributionKey,
      nextContributionKey,
      hasManualTitle: titleManuallyEdited,
      isEdit,
    });

    setTitleManuallyEdited(titleState.hasManualTitle);
    setForm((current) => ({
      ...current,
      contributionKey: nextContributionKey,
      title: titleState.nextTitle,
    }));
    setErrors((current) => ({
      ...current,
      contributionKey: null,
      title: null,
    }));
    setMessage("");
  }

  function handleTitleChange(nextTitle) {
    updateField("title", nextTitle);
    setTitleManuallyEdited(
      isEdit || isContributionTitleCustomized(nextTitle, form.contributionKey),
    );
  }

  function handlePlayerChange(nextPlayerId) {
    applyIdentityChange(nextPlayerId, form.seasonId);
  }

  function handleSeasonChange(nextSeasonId) {
    applyIdentityChange(form.playerId, nextSeasonId);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || isLocked) return;

    setLoading(true);
    setMessage("");

    const action = isEdit ? updateContributionAction : createContributionAction;
    const result = await action(
      buildContributionPayload(form, contribution?.id || null),
    );

    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(
        result?.message || "Der Beitrag konnte nicht gespeichert werden.",
      );
      return;
    }

    const notice = isEdit ? "updated" : "created";
    startTransition(() => {
      router.push(`/admin/contributions/${result.data.id}?notice=${notice}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {message && <FormAlert>{message}</FormAlert>}
      {snapshotNotice && !isLocked && (
        <FormAlert tone="info">{snapshotNotice}</FormAlert>
      )}
      {isLocked && (
        <FormAlert tone="warning">
          {contribution?.status === "canceled"
            ? "Stornierte Beitraege koennen nicht bearbeitet werden."
            : "Befreite Beitraege koennen nicht bearbeitet werden."}
        </FormAlert>
      )}

      <FormSection
        eyebrow="Beitrag"
        title={isEdit ? "Beitrag bearbeiten" : "Neuen Beitrag anlegen"}
        description="Alle Stammdaten des Vereinsbeitrags bleiben serverseitig validiert. Finanzsummen und Status werden nicht frei im Browser gesetzt."
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <ContributionIdentityFields
            playerSearch={playerSearch}
            onPlayerSearchChange={setPlayerSearch}
            visiblePlayers={visiblePlayers}
            form={form}
            onPlayerChange={handlePlayerChange}
            onSeasonChange={handleSeasonChange}
            seasons={seasons}
            errors={errors}
            isLocked={isLocked}
            teamSnapshotOptions={teamSnapshotOptions}
            snapshotState={snapshotState}
            onTeamSnapshotChange={(value) => updateField("teamSnapshotName", value)}
          />
          <ContributionMetaFields
            form={form}
            onContributionKeyChange={handleContributionKeyChange}
            onTitleChange={handleTitleChange}
            onAmountDueChange={(value) => updateField("amountDue", value)}
            onDueDateChange={(value) => updateField("dueDate", value)}
            errors={errors}
            isLocked={isLocked}
          />
        </div>
      </FormSection>

      <FormSection
        eyebrow="Ratenzahlung"
        title="Vereinbarung und Notizen"
        description="Der Fachstatus bleibt serverseitig abgeleitet. Hier werden nur Zusatzinformationen gepflegt."
      >
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <label className="flex items-center gap-3 text-sm font-bold text-white">
            <input
              type="checkbox"
              checked={form.installmentAgreement}
              onChange={(event) =>
                updateField("installmentAgreement", event.target.checked)
              }
              disabled={isLocked}
              className="h-4 w-4 rounded border-white/15 bg-black/20 text-red-500"
            />
            Ratenzahlung vereinbart
          </label>
        </div>

        <div className="mt-4 grid gap-4">
          <TextareaField
            label="Ratenzahlungsnotiz"
            rows={4}
            value={form.installmentNotes}
            onChange={(event) =>
              updateField("installmentNotes", event.target.value)
            }
            disabled={isLocked}
          />
          <TextareaField
            label="Interne Notiz"
            rows={5}
            value={form.internalNotes}
            onChange={(event) => updateField("internalNotes", event.target.value)}
            disabled={isLocked}
          />
        </div>
      </FormSection>

      {isEdit && contribution?.status && (
        <FormSection eyebrow="Status" title="Aktueller Fachstatus">
          <p className="text-sm text-white/65">
            Dieser Beitrag steht aktuell auf{" "}
            <span className="font-bold text-white">
              {getContributionStatusLabel(contribution.status)}
            </span>
            . Summen, Status und Auditfelder werden bewusst nicht frei editiert.
          </p>
        </FormSection>
      )}

      <FormActions
        loading={loading}
        submitLabel={isEdit ? "Beitrag speichern" : "Beitrag anlegen"}
        loadingLabel={isEdit ? "Speichert..." : "Legt an..."}
        cancelHref={
          isEdit ? `/admin/contributions/${contribution.id}` : "/admin/contributions"
        }
      />
    </form>
  );
}
