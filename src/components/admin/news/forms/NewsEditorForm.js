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

export default function NewsEditorForm({ news = null, teams = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialNewsForm(news));
  const [documents, setDocuments] = useState(news?.news_documents || []);
  const [documentsLoading, setDocumentsLoading] = useState(Boolean(news?.id));
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(news?.id);

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
  }, [news?.id]);

  return (
    <form onSubmit={handlers.handleSubmit} className="mt-10 space-y-6">
      <NewsToolbar
        tabs={NEWS_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <NewsContentTab
        activeTab={activeTab}
        form={form}
        teams={teams}
        updateField={handlers.updateField}
      />

      <NewsImagesTab
        activeTab={activeTab}
        news={news}
        form={form}
        setDocuments={setDocuments}
        documents={documents}
        documentsLoading={documentsLoading}
        updateField={handlers.updateField}
        uploadImage={handlers.uploadImage}
        handleDocumentUpload={handlers.handleDocumentUpload}
        handleDocumentDelete={handlers.handleDocumentDelete}
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
