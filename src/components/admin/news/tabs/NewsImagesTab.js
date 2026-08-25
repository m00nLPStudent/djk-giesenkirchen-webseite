import NewsMediaPanel from "../components/NewsMediaPanel";
import NewsSeoPanel from "../components/NewsSeoPanel";

export default function NewsImagesTab({
  activeTab,
  news,
  form,
  setDocuments,
  documents,
  documentsLoading,
  selectedMedia,
  onMediaChange,
  loadMediaAction,
  uploadMediaAction,
  handleDocumentUpload,
  handleDocumentDelete,
}) {
  if (activeTab === "media") {
    return (
      <NewsMediaPanel
        form={form}
        selectedMedia={selectedMedia}
        onMediaChange={onMediaChange}
        loadMediaAction={loadMediaAction}
        uploadMediaAction={uploadMediaAction}
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
