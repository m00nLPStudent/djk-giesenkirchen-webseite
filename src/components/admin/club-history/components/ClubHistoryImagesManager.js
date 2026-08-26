"use client";

import { useState } from "react";
import { InputField, TextareaField } from "@/components/admin/forms";
import { AdminDangerZone, AdminImagePreview, AdminModuleEmptyState } from "@/components/admin/design-system";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import { createClubHistoryImageAction, deleteClubHistoryImageAction, loadClubHistoryMediaPickerAction, updateClubHistoryImageAction, uploadClubHistoryMediaAction } from "@/app/admin/club-history/actions";

const sortByOrder = (items) => [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || new Date(a.created_at || 0) - new Date(b.created_at || 0));

export default function ClubHistoryImagesManager({ pageId, items, setItems, canManage = false }) {
  const [adding, setAdding] = useState(false);
  const [savingIds, setSavingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const loadAction = (filters) => loadClubHistoryMediaPickerAction(filters, pageId);
  const uploadAction = (data) => uploadClubHistoryMediaAction(data, pageId);
  const updateLocalItem = (id, field, value) => setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));

  async function handleAdd(media) {
    if (!pageId || !media?.id) return;
    setAdding(true);
    const result = await createClubHistoryImageAction(pageId, media.id, { sort_order: items.length, is_active: true });
    setAdding(false);
    if (!result.ok) return alert(result.error);
    setItems((current) => sortByOrder([...current, result.data]));
  }

  async function handleSave(item) {
    setSavingIds((current) => [...current, item.id]);
    const result = await updateClubHistoryImageAction(item.id, item.media_asset_id, item);
    setSavingIds((current) => current.filter((id) => id !== item.id));
    if (!result.ok) return alert(result.error);
    setItems((current) => sortByOrder(current.map((entry) => entry.id === result.data.id ? result.data : entry)));
  }

  async function handleDelete(item) {
    if (!window.confirm("Diese Bildzuordnung wirklich löschen?")) return;
    setDeletingIds((current) => [...current, item.id]);
    const result = await deleteClubHistoryImageAction(item.id);
    setDeletingIds((current) => current.filter((id) => id !== item.id));
    if (!result.ok) return alert(result.error);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return <div className="space-y-6">
    {!pageId ? <AdminModuleEmptyState title="Grunddaten zuerst speichern" description="Speichere zuerst die Grunddaten, damit Bilder der Vereinsgeschichte zugeordnet werden können." /> : null}
    {canManage && pageId ? <div className="rounded-3xl border border-white/10 bg-black/20 p-6"><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-red-400">Chronikbild hinzufügen</p><AdminMediaPicker value={null} legacyUrl={null} placeholderUrl="" onChange={(media) => void handleAdd(media)} loadAction={loadAction} uploadAction={uploadAction} usageContext="club_history" entityLabel="Chronikbild" />{adding ? <p className="mt-3 text-sm text-white/55">Zuordnung wird gespeichert …</p> : null}</div> : null}
    {!items.length ? <AdminModuleEmptyState title="Noch keine Bilder hinterlegt" description="Nach dem Speichern der Grunddaten kann das erste Bild hinzugefügt werden." /> : <div className="space-y-5">{sortByOrder(items).map((item) => {
      const saving = savingIds.includes(item.id), deleting = deletingIds.includes(item.id);
      return <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <AdminImagePreview src={item.resolved_image_url || item.image_url} alt={item.alt_text_de || "Vereinsgeschichte"} fileName={item.caption_de || "Bild der Vereinsgeschichte"} />
        <div className="space-y-4">
          {canManage ? <AdminMediaPicker value={item.selectedMedia || null} legacyUrl={item.media_asset_id ? null : item.image_url} placeholderUrl="" onChange={(media) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, media_asset_id: media?.id || null, selectedMedia: media, resolved_image_url: media?.previewUrl || null } : entry))} loadAction={loadAction} uploadAction={uploadAction} usageContext="club_history" entityLabel="Chronikbild" /> : null}
          <InputField label="Alternativtext (DE)" value={item.alt_text_de || ""} onChange={(event) => updateLocalItem(item.id, "alt_text_de", event.target.value)} />
          <TextareaField label="Bildunterschrift (DE)" rows={3} value={item.caption_de || ""} onChange={(event) => updateLocalItem(item.id, "caption_de", event.target.value)} />
          <div className="grid gap-4 md:grid-cols-2"><InputField label="Sortierung" type="number" value={item.sort_order ?? 0} onChange={(event) => updateLocalItem(item.id, "sort_order", Number(event.target.value || 0))} /><label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75"><input type="checkbox" checked={item.is_active ?? true} onChange={(event) => updateLocalItem(item.id, "is_active", event.target.checked)} />Aktiv</label></div>
          {canManage ? <button type="button" onClick={() => void handleSave(item)} disabled={saving || deleting} className="rounded-full bg-red-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Speichert..." : "Bild speichern"}</button> : null}
          {canManage ? <AdminDangerZone title="Bildzuordnung dauerhaft löschen" description="Die Zuordnung wird entfernt. Zentrale Medien und bestehende Legacy-Dateien bleiben erhalten."><button type="button" onClick={() => void handleDelete(item)} disabled={saving || deleting} className="min-h-11 rounded-full border border-red-500/35 px-5 py-2.5 text-sm font-bold text-red-300 disabled:opacity-50">{deleting ? "Löscht..." : "Zuordnung löschen"}</button></AdminDangerZone> : null}
        </div>
      </div></article>;
    })}</div>}
  </div>;
}
