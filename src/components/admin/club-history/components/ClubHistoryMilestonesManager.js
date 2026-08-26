"use client";

import { useState } from "react";
import { InputField, TextareaField } from "@/components/admin/forms";
import { AdminDangerZone, AdminModuleEmptyState } from "@/components/admin/design-system";
import {
  createClubHistoryMilestoneAction,
  deleteClubHistoryMilestoneAction,
  updateClubHistoryMilestoneAction,
} from "@/app/admin/club-history/actions";
function sortMilestones(items) {
  return [...items].sort((a, b) => {
    const yearA = Number(a.milestone_year || 0);
    const yearB = Number(b.milestone_year || 0);
    if (yearA !== yearB) return yearA - yearB;
    const orderA = Number(a.sort_order || 0);
    const orderB = Number(b.sort_order || 0);
    if (orderA !== orderB) return orderA - orderB;
    return (
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime()
    );
  });
}

function formatYearRange(from, to) {
  const yearFrom = Number(from || 0);
  const yearTo = Number(to || 0);

  if (!yearFrom) return "-";
  if (!yearTo || yearTo === yearFrom) return String(yearFrom);
  return `${yearFrom}-${yearTo}`;
}

export default function ClubHistoryMilestonesManager({
  pageId,
  items,
  setItems,
  canManage = false,
}) {
  const [creating, setCreating] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [openId, setOpenId] = useState(null);

  function updateLocalItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleCreate() {
    if (!pageId) {
      alert("Bitte speichere zuerst die Grunddaten.");
      return;
    }

    setCreating(true);
    const result = await createClubHistoryMilestoneAction(pageId, {
      milestone_year: new Date().getFullYear(),
      milestone_year_until: null,
      description_de: "",
      description_en: "",
      sort_order: 0,
      is_active: true,
    });
    setCreating(false);

    if (!result.ok) {
      alert(result.error);
      return;
    }

    if (result.data) {
      setItems((current) => sortMilestones([...current, result.data]));
      setOpenId(result.data.id);
    }
  }

  async function handleSave(item) {
    setSavingIds((current) => [...current, item.id]);
    const result = await updateClubHistoryMilestoneAction(item.id, {
      milestone_year: item.milestone_year,
      milestone_year_until: item.milestone_year_until,
      description_de: item.description_de,
      description_en: item.description_en,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setSavingIds((current) => current.filter((id) => id !== item.id));

    if (!result.ok) {
      alert(result.error);
      return;
    }

    if (result.data) {
      setItems((current) =>
        sortMilestones(
          current.map((entry) => (entry.id === result.data.id ? result.data : entry)),
        ),
      );
    }
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm("Diesen Meilenstein wirklich löschen?");
    if (!shouldDelete) return;

    setDeletingIds((current) => [...current, item.id]);
    const result = await deleteClubHistoryMilestoneAction(item.id);
    setDeletingIds((current) => current.filter((id) => id !== item.id));

    if (!result.ok) {
      alert(result.error);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <div className="space-y-6">
      {!pageId && (
        <AdminModuleEmptyState title="Grunddaten zuerst speichern" description="Speichere zuerst die Grunddaten, damit Meilensteine angelegt werden können." />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
            Meilensteine
          </p>
          <p className="mt-2 text-sm text-white/60">
            Jahr sowie deutsche und optionale englische Beschreibung.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!pageId || creating}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {creating ? "Legt an..." : "Meilenstein hinzufügen"}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <AdminModuleEmptyState title="Noch keine Meilensteine hinterlegt" description="Ergänze den ersten historischen Zeitraum über die vorhandene Aktion." />
      ) : (
        <div className="space-y-3">
          {sortMilestones(items).map((item) => {
            const saving = savingIds.includes(item.id);
            const deleting = deletingIds.includes(item.id);
            const isOpen = openId === item.id;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                  className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[140px_1fr_auto] md:items-center"
                >
                  <p className="text-lg font-black text-red-400">
                    {formatYearRange(
                      item.milestone_year,
                      item.milestone_year_until,
                    )}
                  </p>
                  <p className="line-clamp-2 text-sm text-white/80">
                    {item.description_de || "Keine deutsche Beschreibung"}
                  </p>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                    {isOpen ? "Zuklappen" : "Bearbeiten"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 py-5">
                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <InputField
                        label="Jahr"
                        type="number"
                        value={item.milestone_year || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "milestone_year",
                            Number(event.target.value || 0),
                          )
                        }
                      />

                      <InputField
                        label="Jahr bis (optional)"
                        type="number"
                        value={item.milestone_year_until || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "milestone_year_until",
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <InputField
                        label="Reihenfolge"
                        type="number"
                        value={item.sort_order ?? 0}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "sort_order",
                            Number(event.target.value || 0),
                          )
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <TextareaField
                        label="Beschreibung (DE)"
                        rows={4}
                        value={item.description_de || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "description_de",
                            event.target.value,
                          )
                        }
                      />

                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                        <input
                          type="checkbox"
                          checked={item.is_active ?? true}
                          onChange={(event) =>
                            updateLocalItem(
                              item.id,
                              "is_active",
                              event.target.checked,
                            )
                          }
                        />
                        Aktiv
                      </label>

                      {canManage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleSave(item)}
                            disabled={saving || deleting}
                            className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            {saving ? "Speichert..." : "Meilenstein speichern"}
                          </button>

                        </>
                      ) : null}
                    </div>
                    {canManage ? (
                      <AdminDangerZone title="Meilenstein dauerhaft löschen" description="Dieser historische Eintrag wird mit der bestehenden Löschfunktion dauerhaft entfernt.">
                        <button type="button" onClick={() => void handleDelete(item)} disabled={saving || deleting} className="min-h-11 rounded-full border border-red-500/35 px-5 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">{deleting ? "Löscht..." : "Meilenstein löschen"}</button>
                      </AdminDangerZone>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
