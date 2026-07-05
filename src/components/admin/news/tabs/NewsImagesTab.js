import NewsMediaPanel from "../components/NewsMediaPanel";
import NewsSeoPanel from "../components/NewsSeoPanel";

export default function NewsImagesTab({
  activeTab,
  news,
  form,
  setDocuments,
  documents,
  documentsLoading,
  updateField,
  uploadImage,
  handleDocumentUpload,
  handleDocumentDelete,
}) {
  if (activeTab === "media") {
    return (
      <NewsMediaPanel
        form={form}
        onUpload={uploadImage}
        onRemove={() => updateField("image_url", "")}
      />
    );
  }

  if (activeTab === "documents") {
    return (
      <NewsSeoPanel
        newsId={news?.id}
        documents={documents}
        setDocuments={setDocuments}
        onUploadDocument={handleDocumentUpload}
        onDeleteDocument={handleDocumentDelete}
        loading={documentsLoading}
      />
    );
  }

  return null;
}
