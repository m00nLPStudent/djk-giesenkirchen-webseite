import { FormSection } from "@/components/admin/forms";
import EventDocumentsManager from "../../components/EventDocumentsManager";

export default function EventDocumentsTab({
  isEdit,
  documents,
  setDocuments,
  onUploadDocument,
  onDeleteDocument,
  documentsLoading,
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
          documents={documents}
          setDocuments={setDocuments}
          onUploadDocument={onUploadDocument}
          onDeleteDocument={onDeleteDocument}
          loading={documentsLoading}
        />
      )}
    </FormSection>
  );
}
