"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { InputField, TextareaField } from "@/components/admin/forms";
import { AdminButton, AdminModuleEmptyState, AdminPanel } from "@/components/admin/design-system";
import AdminMediaPickerDialog from "@/components/admin/media-library/AdminMediaPickerDialog";
import { formatFileSize } from "@/lib/files";
import { resolveMediaFileName } from "../helpers/newsMedia.core.mjs";

export default function NewsDocumentsManager({ newsId, documents, setDocuments, onSelectDocument, onDeleteDocument, loadMediaAction, uploadMediaAction, replaceFileAction, updateDocumentAction, loading }) {
  const [pickerTarget, setPickerTarget] = useState(undefined);

  function change(documentItem, field, value) {
    setDocuments((current) => current.map((item) => item.id === documentItem.id ? { ...item, [field]: value } : item));
  }

  async function save(documentItem, field, value) {
    const { data, error } = await updateDocumentAction(documentItem.id, { [field]: value });
    if (error) return alert(error.message);
    if (data) setDocuments((current) => current.map((item) => item.id === documentItem.id ? { ...item, ...data } : item));
  }

  async function select(media) {
    if (pickerTarget) {
      const { data, error } = await replaceFileAction(pickerTarget.id, media.id);
      if (error) return alert(error.message);
      setDocuments((current) => current.map((item) => item.id === pickerTarget.id ? { ...item, ...data } : item));
    } else {
      await onSelectDocument(media);
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div><p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">Dokumente</p><p className="mt-2 text-sm text-white/60">PDF-Dokumente zentral hochladen oder aus der Medienbibliothek wiederverwenden.</p></div>
      <AdminButton type="button" disabled={!newsId} onClick={() => setPickerTarget(null)}>Dokument hinzufügen</AdminButton>
    </div>
    {!newsId ? <p className="text-sm text-amber-200/70">Bitte speichere die News zuerst, bevor du Dokumente hinzufügst.</p> : null}
    {loading ? <p className="text-sm text-white/50">Dokumente werden geladen...</p> : null}
    {!loading && documents.length === 0 ? <AdminModuleEmptyState title="Keine Dokumente" description="Für diese News wurden noch keine Dokumente hinterlegt." /> : null}
    <div className="space-y-4">{documents.map((item) => {
      const fileName = resolveMediaFileName(item, "Dokument");
      return <AdminPanel key={item.id}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex min-w-0 gap-3"><FileText className="mt-1 shrink-0 text-red-400" size={20}/><div className="min-w-0"><p className="break-all text-base font-black text-white">{fileName}</p><p className="mt-1 text-sm text-white/45">{item.mime_type || "Datei"}{formatFileSize(item.file_size) ? ` · ${formatFileSize(item.file_size)}` : ""}</p></div></div>
          <div className="flex flex-wrap gap-2">{item.resolved_file_url ? <AdminButton href={item.resolved_file_url} target="_blank" rel="noopener noreferrer">Öffnen</AdminButton> : null}<AdminButton type="button" onClick={() => setPickerTarget(item)}>Datei ersetzen</AdminButton><AdminButton type="button" variant="danger" onClick={() => onDeleteDocument(item)}>Löschen</AdminButton></div></div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2"><InputField label="Anzeigename" value={item.display_name_de || ""} onChange={(e) => change(item,"display_name_de",e.target.value)} onBlur={(e) => save(item,"display_name_de",e.target.value)}/><InputField label="Reihenfolge" type="number" min="0" value={item.sort_order ?? 0} onChange={(e) => { const value=Number(e.target.value||0); change(item,"sort_order",value); void save(item,"sort_order",value); }}/></div>
        <div className="mt-5"><TextareaField label="Beschreibung" rows={3} value={item.description_de || ""} onChange={(e) => change(item,"description_de",e.target.value)} onBlur={(e) => save(item,"description_de",e.target.value)}/></div>
        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium text-white/70"><input type="checkbox" checked={Boolean(item.is_public)} onChange={(e) => { change(item,"is_public",e.target.checked); void save(item,"is_public",e.target.checked); }}/>Öffentlich sichtbar</label>
      </AdminPanel>;
    })}</div>
    <AdminMediaPickerDialog open={pickerTarget !== undefined} onClose={() => setPickerTarget(undefined)} onSelect={select} loadAction={loadMediaAction} uploadAction={uploadMediaAction} mediaKind="document" defaultPurpose="news" />
  </div>;
}
