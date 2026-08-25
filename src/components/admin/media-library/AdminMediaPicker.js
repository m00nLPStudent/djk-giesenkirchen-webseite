"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import AdminMediaPickerDialog from "./AdminMediaPickerDialog";
import AdminMediaPickerTrigger from "./AdminMediaPickerTrigger";
import { getDefaultPurposeForUsageContext } from "./mediaPurpose.config.mjs";

export default function AdminMediaPicker({ value, legacyUrl, placeholderUrl, onChange, loadAction, uploadAction, usageContext = "coach", defaultPurpose = getDefaultPurposeForUsageContext(usageContext), entityLabel = "Trainerbild" }) {
  const [open, setOpen] = useState(false);
  const previewUrl = value?.previewUrl || legacyUrl || placeholderUrl;

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const data = new FormData();
    data.set("file", file);
    data.set("displayName", file.name);
    data.set("altText", "");
    const response = await uploadAction(data);
    if (response.ok) onChange(response.item);
    else alert(response.error);
  }

  return <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
    <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-black/20 ring-1 ring-white/10">{previewUrl ? <img src={previewUrl} alt={value?.displayName || entityLabel} className="h-full w-full object-cover"/> : <span className="text-sm text-white/40">Kein Bild</span>}</div>
    <div><p className="font-bold">{value?.displayName || (legacyUrl && legacyUrl !== placeholderUrl ? `Bestehendes ${entityLabel}` : "Kein eigenes Bild")}</p>{value ? <p className="mt-1 text-sm text-white/50">{value.visibility} · {value.purpose}</p> : legacyUrl && legacyUrl !== placeholderUrl ? <p className="mt-1 text-sm text-amber-200/70">Legacybild – bleibt unverändert, bis eine neue Auswahl gespeichert wird.</p> : null}<div className="mt-4 flex flex-wrap gap-3"><AdminMediaPickerTrigger onClick={()=>setOpen(true)} label={value || legacyUrl !== placeholderUrl ? "Bild ersetzen" : "Aus Medienbibliothek auswählen"}/><label className="cursor-pointer rounded-full bg-red-600 px-5 py-3 text-sm font-bold"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload}/>Neues Bild hochladen</label>{value || (legacyUrl && legacyUrl !== placeholderUrl) ? <button type="button" onClick={()=>onChange(null)} className="rounded-full border border-red-500/30 px-5 py-3 text-sm font-bold text-red-300">Bild entfernen</button> : null}</div></div>
    <AdminMediaPickerDialog open={open} onClose={()=>setOpen(false)} onSelect={onChange} loadAction={loadAction} uploadAction={uploadAction} defaultPurpose={defaultPurpose}/>
  </div>;
}
