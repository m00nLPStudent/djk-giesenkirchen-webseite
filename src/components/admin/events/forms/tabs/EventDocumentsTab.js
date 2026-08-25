import { FormSection } from "@/components/admin/forms";
import EventDocumentsManager from "../../components/EventDocumentsManager";

export default function EventDocumentsTab({
  isEdit,
  eventId,
  documents,
  setDocuments,
  onSelectDocument,
  onDeleteDocument,
  documentsLoading,
  loadMediaAction,
  uploadMediaAction,
  updateDocumentAction,
}) {
  return (
    <FormSection
      eyebrow="Dokumente"
      title="Dateien zum Termin"
      description="Anhänge für die öffentliche Termin-Detailseite verwalten."
    >
      {!isEdit ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-8 text-center text-sm text-white/55">
          Speichere den Termin zuerst, danach können Dokumente hochgeladen
          werden.
        </div>
      ) : (
        <EventDocumentsManager
          eventId={eventId}
          documents={documents}
          setDocuments={setDocuments}
          onSelectDocument={onSelectDocument}
          onDeleteDocument={onDeleteDocument}
          loading={documentsLoading}
          loadMediaAction={loadMediaAction}
          uploadMediaAction={uploadMediaAction}
          updateDocumentAction={updateDocumentAction}
        />
      )}
    </FormSection>
  );
}
