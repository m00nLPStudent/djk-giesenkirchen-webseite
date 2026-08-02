"use client";

import { InputField, TextareaField } from "@/components/admin/forms";
import { formatFileSize } from "@/lib/files";
import { updateNewsDocument } from "../services/news.service";
import { FileText } from "lucide-react";
import { AdminButton, AdminModuleEmptyState, AdminPanel } from "@/components/admin/design-system";
import { resolveMediaFileName } from "../helpers/newsMedia.core.mjs";

export default function NewsDocumentsManager({
  newsId,
  documents,
  setDocuments,
  onUploadDocument,
  onDeleteDocument,
  loading,
}) {
  const inputId = "news-document-upload";

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    await onUploadDocument(file);
    event.target.value = "";
  }

  function handleDocumentFieldChange(documentItem, field, value) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === documentItem.id ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleDocumentFieldSave(documentItem, field, value) {
    const { data, error } = await updateNewsDocument(documentItem.id, {
      [field]: value,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDocuments((current) =>
        current.map((item) =>
          item.id === documentItem.id ? { ...item, ...data } : item,
        ),
      );
    }
  }

  async function handleDelete(documentItem) {
    await onDeleteDocument(documentItem);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            Dokumente
          </p>
          <p className="mt-2 text-sm text-white/60">
            Lade Dateien wie PDFs, Bilder oder Office-Dokumente hoch und stelle
            sie direkt für die öffentliche News-Detailseite bereit.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-red-500">
          <input
            id={inputId}
            type="file"
            className="sr-only"
            onChange={handleUpload}
          />
          Dokument hochladen
        </label>
      </div>

      {loading && (
        <p className="text-sm text-white/50">Dokumente werden geladen...</p>
      )}

      {!loading && documents.length === 0 && (
        <AdminModuleEmptyState title="Keine Dokumente" description="Für diese News wurden noch keine Dokumente hinterlegt." />
      )}

      <div className="space-y-4">
        {documents.map((documentItem) => {
          const fileSize = formatFileSize(documentItem.file_size);
          const mimeType = documentItem.mime_type || "Datei";
          const fileName = resolveMediaFileName(documentItem, "Dokument");

          return (
            <AdminPanel key={documentItem.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 gap-3"><FileText className="mt-1 shrink-0 text-red-400" size={20} aria-hidden="true" /><div className="min-w-0">
                  <p className="break-all text-base font-black text-white" title={fileName}>{fileName}</p>
                  <p className="mt-1 text-sm text-white/45">
                    {mimeType}
                    {fileSize ? ` · ${fileSize}` : ""}
                  </p>
                </div></div>

                <div className="flex flex-wrap gap-2">{documentItem.file_url ? <AdminButton href={documentItem.file_url} target="_blank" rel="noopener noreferrer">Öffnen</AdminButton> : null}<AdminButton variant="danger" onClick={() => handleDelete(documentItem)}>Löschen</AdminButton></div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <InputField
                  label="Anzeigename"
                  value={documentItem.display_name_de || ""}
                  onChange={(event) =>
                    handleDocumentFieldChange(
                      documentItem,
                      "display_name_de",
                      event.target.value,
                    )
                  }
                  onBlur={(event) =>
                    handleDocumentFieldSave(
                      documentItem,
                      "display_name_de",
                      event.target.value,
                    )
                  }
                />

                <InputField
                  label="Reihenfolge"
                  type="number"
                  min="0"
                  value={documentItem.sort_order ?? 0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value || 0);
                    handleDocumentFieldChange(
                      documentItem,
                      "sort_order",
                      nextValue,
                    );
                    void handleDocumentFieldSave(
                      documentItem,
                      "sort_order",
                      nextValue,
                    );
                  }}
                />
              </div>

              <div className="mt-5">
                <TextareaField
                  label="Beschreibung"
                  rows={3}
                  value={documentItem.description_de || ""}
                  onChange={(event) =>
                    handleDocumentFieldChange(
                      documentItem,
                      "description_de",
                      event.target.value,
                    )
                  }
                  onBlur={(event) =>
                    handleDocumentFieldSave(
                      documentItem,
                      "description_de",
                      event.target.value,
                    )
                  }
                />
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium text-white/70">
                <input
                  type="checkbox"
                  checked={Boolean(documentItem.is_public)}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    handleDocumentFieldChange(
                      documentItem,
                      "is_public",
                      nextValue,
                    );
                    void handleDocumentFieldSave(
                      documentItem,
                      "is_public",
                      nextValue,
                    );
                  }}
                />
                Öffentlich sichtbar
              </label>
            </AdminPanel>
          );
        })}
      </div>
    </div>
  );
}
