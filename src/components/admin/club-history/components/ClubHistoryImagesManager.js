"use client";

import { useState } from "react";
import { InputField, TextareaField } from "@/components/admin/forms";
import {
  createClubHistoryImage,
  deleteClubHistoryImage,
  updateClubHistoryImage,
} from "../services/clubHistory.service";

function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.sort_order || 0);
    const orderB = Number(b.sort_order || 0);
    if (orderA !== orderB) return orderA - orderB;
    return (
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime()
    );
  });
}

export default function ClubHistoryImagesManager({ pageId, items, setItems }) {
  const [uploading, setUploading] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  function updateLocalItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleUpload(file) {
    if (!pageId) {
      alert("Bitte speichere zuerst die Grunddaten.");
      return;
    }

    setUploading(true);
    const { data, error } = await createClubHistoryImage(pageId, file, {
      alt_text_de: "",
      alt_text_en: "",
      caption_de: "",
      caption_en: "",
      sort_order: items.length,
      is_active: true,
    });
    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setItems((current) => sortByOrder([...current, data]));
    }
  }

  async function handleSave(item) {
    setSavingIds((current) => [...current, item.id]);
    const { data, error } = await updateClubHistoryImage(item.id, {
      alt_text_de: item.alt_text_de,
      alt_text_en: item.alt_text_en,
      caption_de: item.caption_de,
      caption_en: item.caption_en,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setSavingIds((current) => current.filter((id) => id !== item.id));

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setItems((current) =>
        sortByOrder(
          current.map((entry) => (entry.id === data.id ? data : entry)),
        ),
      );
    }
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm("Dieses Bild wirklich löschen?");
    if (!shouldDelete) return;

    setDeletingIds((current) => [...current, item.id]);
    const { error } = await deleteClubHistoryImage(item);
    setDeletingIds((current) => current.filter((id) => id !== item.id));

    if (error) {
      alert(error.message);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <div className="space-y-6">
      {!pageId && (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
          Speichere zuerst die Grunddaten, damit Bilder der Vereinsgeschichte
          zugeordnet werden können.
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          Bild hochladen
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700">
            {uploading ? "Upload läuft..." : "Bild auswählen"}
            <input
              type="file"
              accept="image/*"
              disabled={!pageId || uploading}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUpload(file);
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center text-sm text-white/60">
          Noch keine Bilder hinterlegt.
        </div>
      ) : (
        <div className="space-y-5">
          {sortByOrder(items).map((item) => {
            const saving = savingIds.includes(item.id);
            const deleting = deletingIds.includes(item.id);

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                  <div className="overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10">
                    <img
                      src={item.image_url}
                      alt={item.alt_text_de || "Vereinsgeschichte"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Alternativtext (DE)"
                        value={item.alt_text_de || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "alt_text_de",
                            event.target.value,
                          )
                        }
                      />
                      <InputField
                        label="Alt Text (EN)"
                        value={item.alt_text_en || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "alt_text_en",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextareaField
                        label="Bildunterschrift (DE)"
                        rows={3}
                        value={item.caption_de || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "caption_de",
                            event.target.value,
                          )
                        }
                      />
                      <TextareaField
                        label="Caption (EN)"
                        rows={3}
                        value={item.caption_en || ""}
                        onChange={(event) =>
                          updateLocalItem(
                            item.id,
                            "caption_en",
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Sortierung"
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

                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
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
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSave(item)}
                        disabled={saving || deleting}
                        className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {saving ? "Speichert..." : "Bild speichern"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={saving || deleting}
                        className="rounded-full border border-red-500/35 px-6 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deleting ? "Löscht..." : "Bild löschen"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
