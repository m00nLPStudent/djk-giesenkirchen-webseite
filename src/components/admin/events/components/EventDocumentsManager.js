"use client";

import { InputField, TextareaField } from "@/components/admin/forms";
import { formatFileSize } from "@/lib/files";
import { updateEventDocument } from "../services/events.service";

export default function EventDocumentsManager({
  documents,
  setDocuments,
  onUploadDocument,
  onDeleteDocument,
  loading,
}) {
  const inputId = "event-document-upload";

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
    const { data, error } = await updateEventDocument(documentItem.id, {
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
            sie direkt für die öffentliche Termin-Detailseite bereit.
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
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-white/55">
          Noch keine Dokumente vorhanden.
        </div>
      )}

      <div className="space-y-4">
        {documents.map((documentItem) => {
          const fileSize = formatFileSize(documentItem.file_size);
          const mimeType = documentItem.mime_type || "Datei";

          return (
            <div
              key={documentItem.id}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-white">
                    {documentItem.file_name || "Dokument"}
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    {mimeType}
                    {fileSize ? ` · ${fileSize}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(documentItem)}
                  className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                >
                  Löschen
                </button>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
