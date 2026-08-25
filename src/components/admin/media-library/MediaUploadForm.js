"use client";

import { useActionState } from "react";
import { uploadMediaAction } from "@/app/admin/media/actions";
import { MEDIA_PURPOSE_OPTIONS } from "./mediaPurpose.config.mjs";

const initialState = { ok: false, error: null };

export default function MediaUploadForm() {
  const [state, action, pending] = useActionState(async (_state, formData) => uploadMediaAction(formData), initialState);
  return <form action={action} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-2">
    <label className="space-y-2 text-sm font-bold text-white">Datei<input required name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-white/70" /></label>
    <label className="space-y-2 text-sm font-bold text-white">Anzeigename<input name="displayName" maxLength={200} className="block w-full rounded-2xl border border-white/10 bg-black/20 p-3" /></label>
    <label className="space-y-2 text-sm font-bold text-white">Verwendung<select name="purpose" defaultValue="document" className="block w-full rounded-2xl border border-white/10 bg-neutral-900 p-3">{MEDIA_PURPOSE_OPTIONS.map((option)=><option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
    <label className="space-y-2 text-sm font-bold text-white">Sichtbarkeit<select name="visibility" defaultValue="admin" className="block w-full rounded-2xl border border-white/10 bg-neutral-900 p-3"><option value="public">Öffentlich</option><option value="admin">Adminbereich</option><option value="restricted">Eingeschränkt</option></select></label>
    <label className="space-y-2 text-sm font-bold text-white md:col-span-2">Alternativtext<input name="altText" maxLength={500} className="block w-full rounded-2xl border border-white/10 bg-black/20 p-3" /></label>
    {state.error ? <p role="alert" className="text-sm text-red-300 md:col-span-2">{state.error}</p> : null}
    {state.ok ? <p role="status" className="text-sm text-green-300 md:col-span-2">Medium wurde registriert.</p> : null}
    <button disabled={pending} className="w-fit rounded-full bg-red-600 px-6 py-3 font-black text-white disabled:opacity-50">{pending ? "Upload läuft …" : "Medium hochladen"}</button>
  </form>;
}
