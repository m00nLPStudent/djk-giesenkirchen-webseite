"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTrainingException,
  deleteTrainingException,
  getTrainingExceptions,
  getTrainingTimes,
  updateTrainingException,
} from "../services/training.service";
import { createNewException } from "../training/trainingDefaults";
import {
  toDateValue,
  toTimeValue,
} from "../training/trainingExceptionFormatters";
import TrainingExceptionsList from "../training/TrainingExceptionsList";

export default function TrainingExceptionsManager({ teamSeasonId }) {
  const [trainingTimes, setTrainingTimes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const trainingTimeMap = useMemo(() => {
    return new Map(trainingTimes.map((item) => [item.id, item]));
  }, [trainingTimes]);

  useEffect(() => {
    async function loadData() {
      if (!teamSeasonId) {
        setTrainingTimes([]);
        setItems([]);
        return;
      }

      setLoading(true);

      const [timesResult, exceptionsResult] = await Promise.all([
        getTrainingTimes({ teamSeasonId, includeInactive: true }),
        getTrainingExceptions({ teamSeasonId, includeInactive: true }),
      ]);

      setLoading(false);

      if (timesResult.error) {
        alert(timesResult.error.message);
        return;
      }

      if (exceptionsResult.error) {
        alert(exceptionsResult.error.message);
        return;
      }

      setTrainingTimes(timesResult.data || []);
      setItems(exceptionsResult.data || []);
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

  async function persistItem(nextItem) {
    const payload = {
      ...nextItem,
      exception_date: toDateValue(nextItem.exception_date),
      override_start_time: toTimeValue(nextItem.override_start_time),
      override_end_time: toTimeValue(nextItem.override_end_time),
    };

    const { data, error } = await updateTrainingException(nextItem.id, payload);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setItems((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
    }
  }

  async function handleCreate() {
    if (!trainingTimes.length) {
      alert("Bitte zuerst mindestens eine Trainingszeit anlegen.");
      return;
    }

    setCreating(true);
    const { data, error } = await createTrainingException(
      createNewException(trainingTimes[0].id),
    );
    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    setItems((current) => [...current, data]);
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm("Diese Ausnahme wirklich löschen?");
    if (!shouldDelete) return;

    const { error } = await deleteTrainingException(item.id);
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
            Ausnahmen
          </p>
          <p className="mt-2 text-sm text-white/60">
            Lege Ausnahmen fest, wenn ein Training ausfällt oder verlegt wird.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!teamSeasonId || !trainingTimes.length || creating}
          className="rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Wird angelegt..." : "Ausnahme hinzufügen"}
        </button>
      </div>

      {!teamSeasonId && (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/55">
          Speichere die Mannschaft zuerst, damit Ausnahmen der aktuellen
          Team-Saison zugeordnet werden können.
        </div>
      )}

      {teamSeasonId && !loading && trainingTimes.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-white/55">
          Für Ausnahmen muss zuerst mindestens eine Trainingszeit angelegt
          werden.
        </div>
      )}

      {teamSeasonId && loading && (
        <p className="text-sm text-white/50">Ausnahmen werden geladen...</p>
      )}

      {teamSeasonId &&
        !loading &&
        items.length === 0 &&
        trainingTimes.length > 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-white/55">
            Noch keine Ausnahmen vorhanden.
          </div>
        )}

      <TrainingExceptionsList
        items={items}
        trainingTimeMap={trainingTimeMap}
        trainingTimes={trainingTimes}
        onDelete={handleDelete}
        onFieldChange={updateLocalItem}
        onPersist={persistItem}
      />
    </div>
  );
}
