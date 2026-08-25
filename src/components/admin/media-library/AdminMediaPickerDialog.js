"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { formatFileSize } from "@/lib/files";
import { getPickerPurposeOptions } from "./mediaPurpose.config.mjs";
import { getMediaFileSizeError } from "./mediaValidation.core.mjs";

const PAGE_SIZE = 12;
const initialFilters = (purpose) => ({ search: "", visibility: "all", purpose, page: 1, pageSize: PAGE_SIZE });

export default function AdminMediaPickerDialog({ open, onClose, onSelect, loadAction, uploadAction, mediaKind = "image", defaultPurpose = "coach", allowUpload = true }) {
  const dialogRef = useRef(null);
  const searchRef = useRef(null);
  const [filters, setFilters] = useState(initialFilters(defaultPurpose));
  const [result, setResult] = useState({ items: [], total: 0, error: null });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const purposeOptions = getPickerPurposeOptions(mediaKind);
  const isDocument = mediaKind === "document";

  async function load(next) {
    setLoading(true);
    const response = await loadAction({ ...next, kind: mediaKind });
    setResult({ items: response.items || [], total: response.total || 0, error: response.ok ? null : response.error });
    setLoading(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      const next = initialFilters(defaultPurpose);
      setFilters(next);
      dialog.showModal();
      void load(next);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    if (!open && dialog?.open) dialog.close();
  // Opening intentionally resets the picker to its fachlicher Default-Purpose.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() { dialogRef.current?.close(); onClose(); }
  async function search(event) { event?.preventDefault(); event?.stopPropagation(); const next = { ...filters, page: 1 }; setFilters(next); await load(next); }
  async function changePurpose(purpose) { const next = { ...filters, purpose, page: 1 }; setFilters(next); await load(next); }
  async function go(page) { const next = { ...filters, page }; setFilters(next); await load(next); }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const sizeError = getMediaFileSizeError(file);
    if (sizeError) { setResult((current) => ({ ...current, error: sizeError })); return; }
    setUploading(true);
    const data = new FormData(); data.set("file", file); data.set("displayName", file.name); data.set("altText", "");
    const response = await uploadAction(data); setUploading(false);
    if (!response.ok) { setResult((current) => ({ ...current, error: response.error })); return; }
    onSelect(response.item); close();
  }

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  return <dialog ref={dialogRef} aria-labelledby="media-picker-title" onCancel={(event) => { event.preventDefault(); close(); }} onClose={onClose} className="m-auto max-h-[92vh] w-[min(96vw,72rem)] rounded-3xl border border-white/15 bg-zinc-950 p-0 text-white backdrop:bg-black/80">
    <div className="flex max-h-[92vh] flex-col"><header className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 id="media-picker-title" className="text-xl font-black">Medium auswählen</h2><p className="mt-1 text-sm text-white/50">Ein vorhandenes Bild wählen oder direkt neu hochladen.</p></div><button type="button" onClick={close} className="rounded-full border border-white/15 px-4 py-2 font-bold">Abbrechen</button></header>
      <div className="overflow-y-auto p-5"><div onKeyDown={(event) => { if (event.key === "Enter" && event.target === searchRef.current) void search(event); }} className="grid gap-3 sm:grid-cols-4">
        <input ref={searchRef} value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Name, Datei, Alttext, Beschreibung …" className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:col-span-2"/>
        <select value={filters.visibility} onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))} className="rounded-2xl border border-white/10 bg-neutral-900 p-3"><option value="all">Alle Sichtbarkeiten</option><option value="public">Öffentlich</option><option value="admin">Admin</option></select>
        <select aria-label="Verwendung" value={filters.purpose} onChange={(event) => void changePurpose(event.target.value)} className="rounded-2xl border border-white/10 bg-neutral-900 p-3"><option value="all">Alle Verwendungen</option>{purposeOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select>
        <button type="button" onClick={search} className="w-fit rounded-full border border-white/15 px-5 py-2 font-bold">Suchen</button>
        {allowUpload ? <label className="w-fit cursor-pointer rounded-full bg-red-600 px-5 py-2 font-bold"><input type="file" accept={isDocument ? "application/pdf" : "image/jpeg,image/png,image/webp"} className="sr-only" disabled={uploading} onChange={upload}/>{uploading ? "Upload läuft …" : `Neues ${isDocument ? "Dokument" : "Bild"} hochladen`}</label> : null}
      </div>
      {result.error ? <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 p-4 text-red-200">{result.error}</p> : null}{loading ? <p className="mt-8 text-center text-white/50">Medien werden geladen …</p> : null}
      {!loading ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <button type="button" key={item.id} onClick={() => { onSelect(item); close(); }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left hover:border-red-400/60">{item.media_kind === "image" && item.previewUrl ? <img src={item.previewUrl} alt={item.alt_text || ""} className="aspect-video w-full object-cover"/> : <span className="flex aspect-video items-center justify-center bg-black/20"><FileText aria-hidden="true"/></span>}<span className="block p-4"><strong className="block truncate">{item.display_name}</strong><span className="mt-1 block text-xs text-white/50">{formatFileSize(item.file_size_bytes) || "–"} · {item.visibility} · {item.purpose}</span></span></button>)}</div> : null}
      {!loading && !result.items.length ? <p className="mt-8 text-center text-white/50">Keine auswählbaren Medien gefunden.</p> : null}
      <nav aria-label="Medienseiten" className="mt-6 flex items-center justify-center gap-4"><button type="button" disabled={filters.page <= 1 || loading} onClick={() => go(filters.page - 1)} className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-30">Zurück</button><span className="text-sm text-white/60">Seite {filters.page} von {pages}</span><button type="button" disabled={filters.page >= pages || loading} onClick={() => go(filters.page + 1)} className="rounded-full border border-white/15 px-4 py-2 disabled:opacity-30">Weiter</button></nav>
      </div>
    </div>
  </dialog>;
}
