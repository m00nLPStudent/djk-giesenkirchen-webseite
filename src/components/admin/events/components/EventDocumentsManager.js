"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { InputField, TextareaField } from "@/components/admin/forms";
import { AdminButton, AdminModuleEmptyState, AdminPanel } from "@/components/admin/design-system";
import AdminMediaPickerDialog from "@/components/admin/media-library/AdminMediaPickerDialog";
import { formatFileSize } from "@/lib/files";

export default function EventDocumentsManager({ eventId, documents, setDocuments, onSelectDocument, onDeleteDocument, loadMediaAction, uploadMediaAction, updateDocumentAction, loading }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function change(item, field, value) {
    setDocuments((current) => current.map((document) => document.id === item.id ? { ...document, [field]: value } : document));
  }

  async function save(item, field, value) {
    const { data, error } = await updateDocumentAction(item.id, { [field]: value });
    if (error) return alert(error.message);
    if (data) setDocuments((current) => current.map((document) => document.id === item.id ? { ...document, ...data } : document));
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div><p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">Dokumente</p><p className="mt-2 text-sm text-white/60">PDF-Dokumente zentral hochladen oder aus der Medienbibliothek wiederverwenden.</p></div>
      <AdminButton type="button" disabled={!eventId} onClick={() => setPickerOpen(true)}>Dokument hinzufügen</AdminButton>
    </div>
    {loading ? <p className="text-sm text-white/50">Dokumente werden geladen...</p> : null}
    {!loading && documents.length === 0 ? <AdminModuleEmptyState title="Keine Dokumente" description="Für diesen Termin wurden noch keine Dokumente hinterlegt." /> : null}
    <div className="space-y-4">{documents.map((item) => <AdminPanel key={item.id}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex min-w-0 gap-3"><FileText className="mt-1 shrink-0 text-red-400" size={20}/><div className="min-w-0"><p className="break-all text-base font-black text-white">{item.display_name_de || item.file_name || "Dokument"}</p><p className="mt-1 text-sm text-white/45">{item.mime_type || "Datei"}{formatFileSize(item.file_size) ? ` · ${formatFileSize(item.file_size)}` : ""}</p></div></div>
        <div className="flex flex-wrap gap-2">{item.resolved_file_url ? <AdminButton href={item.resolved_file_url} target="_blank" rel="noopener noreferrer">Öffnen</AdminButton> : null}<AdminButton type="button" variant="danger" onClick={() => onDeleteDocument(item)}>Entfernen</AdminButton></div></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2"><InputField label="Anzeigename" value={item.display_name_de || ""} onChange={(event) => change(item,"display_name_de",event.target.value)} onBlur={(event) => save(item,"display_name_de",event.target.value)}/><InputField label="Reihenfolge" type="number" min="0" value={item.sort_order ?? 0} onChange={(event) => { const value=Number(event.target.value||0); change(item,"sort_order",value); void save(item,"sort_order",value); }}/></div>
      <div className="mt-5"><TextareaField label="Beschreibung" rows={3} value={item.description_de || ""} onChange={(event) => change(item,"description_de",event.target.value)} onBlur={(event) => save(item,"description_de",event.target.value)}/></div>
      <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium text-white/70"><input type="checkbox" checked={Boolean(item.is_public)} onChange={(event) => { change(item,"is_public",event.target.checked); void save(item,"is_public",event.target.checked); }}/>Öffentlich sichtbar</label>
    </AdminPanel>)}</div>
    <AdminMediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onSelectDocument} loadAction={loadMediaAction} uploadAction={uploadMediaAction} mediaKind="document" defaultPurpose="event" />
  </div>;
}
