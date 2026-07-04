"use client";

import { useEffect, useRef, useState } from "react";
import {
  createTrainingTime,
  deleteTrainingTime,
  getTrainingTimes,
  updateTrainingTime,
} from "../services/training.service";
import TrainingTimeCard from "../training/TrainingTimeCard";
import TrainingTimesCreatePanel from "../training/TrainingTimesCreatePanel";
import { createNewTrainingTime } from "../training/trainingDefaults";
import {
  buildSuccessMessage,
  sortTrainingTimes,
  toDateValue,
  toTimeValue,
} from "../training/trainingFormatters";

export default function TrainingTimesManager({ teamSeasonId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(() => createNewTrainingTime(teamSeasonId));
  const [selectedWeekdays, setSelectedWeekdays] = useState([1]);
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  const [openItemIds, setOpenItemIds] = useState([]);
  const itemRefs = useRef(new Map());

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (!highlightedIds.length) return undefined;

    const timeoutId = window.setTimeout(() => {
      setHighlightedIds([]);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedIds]);

  useEffect(() => {
    async function loadData() {
      if (!teamSeasonId) {
        setItems([]);
        return;
      }

      setLoading(true);
      const { data, error } = await getTrainingTimes({
        teamSeasonId,
        includeInactive: true,
      });
      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      const sortedItems = sortTrainingTimes(data || []);
      setItems(sortedItems);
      setIsCreateOpen(sortedItems.length === 0);
      setOpenItemIds([]);
    }

    void loadData();
  }, [teamSeasonId]);

  function updateLocalItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleWeekday(weekday) {
    setSelectedWeekdays((current) => {
      if (current.includes(weekday)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== weekday);
      }

      return [...current, weekday].sort((left, right) => left - right);
    });
  }

  function toggleItemOpen(itemId) {
    setOpenItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  async function persistItem(nextItem) {
    const payload = {
      ...nextItem,
      start_time: toTimeValue(nextItem.start_time),
      end_time: toTimeValue(nextItem.end_time),
      effective_from: toDateValue(nextItem.effective_from),
      effective_until: toDateValue(nextItem.effective_until),
    };

    const { data, error } = await updateTrainingTime(nextItem.id, payload);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setItems((current) =>
        sortTrainingTimes(
          current.map((item) => (item.id === data.id ? data : item)),
        ),
      );
    }
  }

  async function handleCreate() {
    if (!teamSeasonId) {
      alert(
        "Bitte zuerst die Mannschaft speichern, damit eine Team-Saison vorhanden ist.",
      );
      return;
    }

    if (!selectedWeekdays.length) {
      alert("Bitte mindestens einen Wochentag auswählen.");
      return;
    }

    setCreating(true);
    const payload = selectedWeekdays.map((weekday) => ({
      ...draft,
      team_season_id: teamSeasonId,
      weekday,
    }));
    const { data, error } = await createTrainingTime(payload);
    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    const createdItems = sortTrainingTimes(data || []);
    const createdIds = createdItems.map((item) => item.id).filter(Boolean);

    setItems((current) => sortTrainingTimes([...current, ...createdItems]));
    setSuccessMessage(buildSuccessMessage(createdItems) || "");
    setHighlightedIds(createdIds);
    setDraft(createNewTrainingTime(teamSeasonId));
    setSelectedWeekdays([1]);
    setIsCreateOpen(false);
    setOpenItemIds(createdIds);

    if (createdIds.length > 0) {
      window.setTimeout(() => {
        const firstCreatedId = createdIds[0];
        const element = itemRefs.current.get(firstCreatedId);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm(
      "Diese Trainingszeit wirklich löschen?",
    );
    if (!shouldDelete) return;

    const { error } = await deleteTrainingTime(item.id);
    if (error) {
      alert(error.message);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            Trainingszeiten
          </p>
          <p className="mt-2 text-sm text-white/60">
            Verwalte alle regelmäßigen Trainingszeiten dieser Mannschaft.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!teamSeasonId || creating}
          className="rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Wird angelegt..." : "Trainingszeit hinzufügen"}
        </button>
      </div>

      <TrainingTimesCreatePanel
        draft={draft}
        selectedWeekdays={selectedWeekdays}
        isOpen={isCreateOpen}
        onToggleOpen={() => setIsCreateOpen((current) => !current)}
        onToggleWeekday={toggleWeekday}
        onUpdateDraft={updateDraft}
      />

      {!teamSeasonId && (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/55">
          Speichere die Mannschaft zuerst, damit Trainingszeiten der aktuellen
          Team-Saison zugeordnet werden können.
        </div>
      )}

      {successMessage && (
        <div className="rounded-[1.75rem] border border-green-500/35 bg-green-500/10 p-4 text-sm font-medium text-green-200">
          {successMessage}
        </div>
      )}

      {teamSeasonId && loading && (
        <p className="text-sm text-white/50">
          Trainingszeiten werden geladen...
        </p>
      )}

      {teamSeasonId && !loading && items.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-white/55">
          Noch keine Trainingszeiten vorhanden.
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const isHighlighted = highlightedIds.includes(item.id);
          const isOpen = openItemIds.includes(item.id);

          return (
            <TrainingTimeCard
              key={item.id}
              item={item}
              isHighlighted={isHighlighted}
              isOpen={isOpen}
              itemRef={(element) => {
                if (element) {
                  itemRefs.current.set(item.id, element);
                } else {
                  itemRefs.current.delete(item.id);
                }
              }}
              onToggleOpen={() => toggleItemOpen(item.id)}
              onDelete={() => handleDelete(item)}
              onFieldChange={(field, value) =>
                updateLocalItem(item.id, field, value)
              }
              onPersist={persistItem}
            />
          );
        })}
      </div>
    </div>
  );
}
