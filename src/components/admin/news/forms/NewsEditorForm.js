"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewsSaveBar from "../components/NewsSaveBar";
import NewsToolbar from "../components/NewsToolbar";
import { createNewsHandlers } from "../helpers/newsHandlers";
import { createInitialNewsForm } from "../helpers/newsInitialState";
import { NEWS_FORM_TABS } from "../helpers/newsOptions";
import NewsContentTab from "../tabs/NewsContentTab";
import NewsImagesTab from "../tabs/NewsImagesTab";
import NewsSettingsTab from "../tabs/NewsSettingsTab";
import { loadNewsDocumentPickerAction, loadNewsMediaPickerAction, replaceNewsDocumentFileAction, updateNewsDocumentAction, uploadNewsDocumentMediaAction, uploadNewsMediaAction } from "@/app/admin/news/actions";

export default function NewsEditorForm({ news = null, initialMedia = null, teams = [], categories = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialNewsForm(news));
  const [documents, setDocuments] = useState(news?.news_documents || []);
  const [documentsLoading, setDocumentsLoading] = useState(Boolean(news?.id));
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const isEdit = Boolean(news?.id);

  function handleMediaChange(media) {
    setSelectedMedia(media || null);
    setForm((current) => ({ ...current, image_media_asset_id: media?.id || null, remove_legacy_image: !media }));
  }

  const handlers = createNewsHandlers({
    news,
    isEdit,
    form,
    setForm,
    setDocuments,
    setDocumentsLoading,
    setLoading,
    setActiveTab,
    router,
  });

  useEffect(() => {
    handlers.loadDocuments();
    // The document reload is intentionally tied to the persisted news record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news?.id]);

  return (
    <form id="news-editor-form" onSubmit={handlers.handleSubmit} className="space-y-5">
      <NewsToolbar
        tabs={NEWS_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <NewsContentTab
        activeTab={activeTab}
        form={form}
        teams={teams}
        categories={categories}
        updateField={handlers.updateField}
      />

      <NewsImagesTab
        activeTab={activeTab}
        news={news}
        form={form}
        setDocuments={setDocuments}
        documents={documents}
        documentsLoading={documentsLoading}
        selectedMedia={selectedMedia}
        onMediaChange={handleMediaChange}
        loadMediaAction={(filters) => loadNewsMediaPickerAction(filters, news?.id || null)}
        uploadMediaAction={(data) => uploadNewsMediaAction(data, news?.id || null)}
        handleDocumentSelect={handlers.handleDocumentSelect}
        handleDocumentDelete={handlers.handleDocumentDelete}
        loadDocumentMediaAction={(filters) => loadNewsDocumentPickerAction(filters, news?.id)}
        uploadDocumentMediaAction={(data) => uploadNewsDocumentMediaAction(data, news?.id)}
        replaceDocumentFileAction={replaceNewsDocumentFileAction}
        updateDocumentAction={updateNewsDocumentAction}
      />

      <NewsSettingsTab
        activeTab={activeTab}
        form={form}
        updateField={handlers.updateField}
      />

      <NewsSaveBar loading={loading} isEdit={isEdit} />
    </form>
  );
}
