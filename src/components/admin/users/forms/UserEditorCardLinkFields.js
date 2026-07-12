"use client";

import { useMemo } from "react";

const NO_LINK_VALUE = "__none__";

function classifyLinkValue(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const normalized = String(value).trim();
  if (!normalized) return "empty-string";
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalized,
    )
  ) {
    return "uuid";
  }
  return `string:${normalized.length}`;
}

function logSelectStage(field, rawValue, normalizedValue) {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[B12.2a-1.1][CardLink][SelectChange]", {
    field,
    rawValueState: classifyLinkValue(rawValue),
    normalizedState: classifyLinkValue(normalizedValue),
    normalizedType: typeof normalizedValue,
    isNull: normalizedValue === null,
    isEmptyString: normalizedValue === "",
    isUndefined: normalizedValue === undefined,
  });
}

export default function UserEditorCardLinkFields({
  values,
  boardMembers,
  coaches,
  matchPreview,
  onBoardChange,
  onCoachChange,
}) {
  const availableBoardMembers = useMemo(() => {
    return (boardMembers || []).filter((entry) => {
      if (!entry?.id) return false;
      if (!entry.admin_profile_id) return true;
      return entry.admin_profile_id === values.id;
    });
  }, [boardMembers, values.id]);

  const availableCoaches = useMemo(() => {
    return (coaches || []).filter((entry) => {
      if (!entry?.id) return false;
      if (!entry.admin_profile_id) return true;
      return entry.admin_profile_id === values.id;
    });
  }, [coaches, values.id]);

  function handleBoardSelectChange(event) {
    const rawValue = event.target.value;
    const normalizedValue =
      rawValue === NO_LINK_VALUE ? null : String(rawValue || "").trim();
    logSelectStage("board_member", rawValue, normalizedValue);
    onBoardChange(normalizedValue);
  }

  function handleCoachSelectChange(event) {
    const rawValue = event.target.value;
    const normalizedValue =
      rawValue === NO_LINK_VALUE ? null : String(rawValue || "").trim();
    logSelectStage("coach", rawValue, normalizedValue);
    onCoachChange(normalizedValue);
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
        Kachel-Verknuepfung
      </p>
      <p className="text-xs text-white/60">
        Nur Superadmin: feste Zuordnung ueber admin_profile_id. E-Mail dient nur
        als einmalige Match-Hilfe.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Vorstandskachel
          </span>
          <select
            value={
              values.linked_board_member_id === null
                ? NO_LINK_VALUE
                : (values.linked_board_member_id ?? "")
            }
            onChange={handleBoardSelectChange}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value={NO_LINK_VALUE} className="bg-slate-900">
              Keine Zuordnung
            </option>
            {availableBoardMembers.map((entry) => (
              <option key={entry.id} value={entry.id} className="bg-slate-900">
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Trainer-/Betreuerkachel
          </span>
          <select
            value={
              values.linked_coach_id === null
                ? NO_LINK_VALUE
                : (values.linked_coach_id ?? "")
            }
            onChange={handleCoachSelectChange}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value={NO_LINK_VALUE} className="bg-slate-900">
              Keine Zuordnung
            </option>
            {availableCoaches.map((entry) => (
              <option key={entry.id} value={entry.id} className="bg-slate-900">
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {matchPreview ? (
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
          <p>Match-Hilfe (E-Mail): {matchPreview.profileEmailMasked || "-"}</p>
          <p>Vorstand: {matchPreview.board?.status || "no_match"}</p>
          <p>Trainer: {matchPreview.coach?.status || "no_match"}</p>
          {matchPreview.duplicateProfileWarning ? (
            <p className="text-amber-200">
              {matchPreview.duplicateProfileWarning}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
