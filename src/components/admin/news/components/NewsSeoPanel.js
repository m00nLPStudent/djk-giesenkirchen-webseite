import { FormSection } from "@/components/admin/forms";
import NewsDocumentsManager from "./NewsDocumentsManager";

export default function NewsSeoPanel({
  newsId,
  documents,
  setDocuments,
  onUploadDocument,
  onDeleteDocument,
  loading,
}) {
  return (
    <FormSection
      eyebrow="Dokumente"
      title="Downloads und Anhänge"
      description="Füge der News öffentliche Dokumente wie PDFs, Bilder oder Office-Dateien hinzu."
    >
      <NewsDocumentsManager
        newsId={newsId}
        documents={documents}
        setDocuments={setDocuments}
        onUploadDocument={onUploadDocument}
        onDeleteDocument={onDeleteDocument}
        loading={loading}
      />
    </FormSection>
  );
}
