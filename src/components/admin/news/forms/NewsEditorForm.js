"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  TextareaField,
} from "@/components/admin/forms";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import NewsImageUpload from "../components/NewsImageUpload";
import { createSlug } from "../utils/slug";
import {
  createNews,
  deleteNewsDocument,
  getNewsDocuments,
  updateNews,
  updateNewsDocument,
  uploadNewsDocument,
  uploadNewsImage,
} from "../services/news.service";
import NewsCategoryFields, {
  getCategoryKeyFromLabel,
} from "./NewsCategoryFields";
import NewsDocumentsManager from "../components/NewsDocumentsManager";

const NEWS_FORM_TABS = [
  { id: "basic", label: "Grunddaten" },
  { id: "category", label: "Kategorie" },
  { id: "content", label: "Inhalt" },
  { id: "media", label: "Medien" },
  { id: "documents", label: "Dokumente" },
  { id: "settings", label: "Einstellungen" },
];

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function createInitialNewsForm(news) {
  const category = news?.category || "Allgemein";

  return {
    title_de: news?.title_de || "",
    title_en: news?.title_en || "",
    teaser_de: news?.teaser_de || "",
    teaser_en: news?.teaser_en || "",
    content_de: news?.content_de || "",
    content_en: news?.content_en || "",
    category,
    category_key: news?.category_key || getCategoryKeyFromLabel(category),
    football_team_id: news?.football_team_id || "",
    image_url: news?.image_url || "",
    is_published: news?.is_published ?? true,
    published_at: formatDateTimeLocal(news?.published_at),
  };
}

export default function NewsEditorForm({ news = null, teams = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialNewsForm(news));
  const [documents, setDocuments] = useState(news?.news_documents || []);
  const [documentsLoading, setDocumentsLoading] = useState(Boolean(news?.id));
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(news?.id);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    if (!news?.id) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }

    async function loadDocuments() {
      setDocumentsLoading(true);
      const { data, error } = await getNewsDocuments(news.id);
      setDocumentsLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      setDocuments(data || []);
    }

    loadDocuments();
  }, [news?.id]);

  async function uploadImage(file) {
    const { data, error } = await uploadNewsImage(file);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function handleDocumentUpload(file) {
    if (!news?.id) {
      alert("Bitte speichere die News erst, bevor du Dokumente hochlädst.");
      return;
    }

    setDocumentsLoading(true);
    const { data, error } = await uploadNewsDocument(file, news.id);
    setDocumentsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDocuments((current) => [...current, data]);
    }
  }

  async function handleDocumentDelete(documentItem) {
    if (!documentItem?.id) return;

    const { error } = await deleteNewsDocument(documentItem);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((current) =>
      current.filter((item) => item.id !== documentItem.id),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title_de.trim()) {
      alert("Bitte mindestens einen deutschen Titel eintragen.");
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const publishedAt = form.is_published
      ? form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString()
      : null;

    const payload = {
      ...form,
      slug: news?.slug || createSlug(form.title_de),
      author: news?.author || "DJK/VfL Giesenkirchen",
      football_team_id:
        form.category_key === "fussball" ? form.football_team_id || null : null,
      is_published: form.is_published,
      published_at: publishedAt,
    };

    const { data: savedNews, error } = isEdit
      ? await updateNews(news.id, payload)
      : await createNews(payload);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    if (!isEdit && savedNews?.id) {
      setDocuments([]);
    }

    router.push("/admin/news");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <TabNavigation
        tabs={NEWS_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "basic" && (
        <FormSection
          eyebrow="News"
          title="Grunddaten"
          description="Titel und kurzer Teaser für die News-Karten auf der Startseite und in der Übersicht."
        >
          <FormGrid>
            <InputField
              label="Titel Deutsch"
              required
              value={form.title_de}
              onChange={(event) => updateField("title_de", event.target.value)}
            />
            <InputField
              label="Titel Englisch"
              value={form.title_en}
              onChange={(event) => updateField("title_en", event.target.value)}
            />
          </FormGrid>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TextareaField
              label="Teaser Deutsch"
              rows={4}
              value={form.teaser_de}
              onChange={(event) => updateField("teaser_de", event.target.value)}
            />
            <TextareaField
              label="Teaser Englisch"
              rows={4}
              value={form.teaser_en}
              onChange={(event) => updateField("teaser_en", event.target.value)}
            />
          </div>
        </FormSection>
      )}

      {activeTab === "category" && (
        <FormSection
          eyebrow="Kategorie"
          title="News einordnen"
          description="Wähle aus, ob es eine allgemeine Vereinsmeldung, Fußball-News oder eine andere Kategorie ist. Bei Fußball kannst du zusätzlich eine Mannschaft auswählen."
        >
          <NewsCategoryFields
            form={form}
            teams={teams}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "content" && (
        <FormSection
          eyebrow="Inhalt"
          title="News-Inhalt"
          description="Der vollständige Text für die spätere Detailseite."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <TextareaField
              label="Inhalt Deutsch"
              rows={14}
              value={form.content_de}
              onChange={(event) =>
                updateField("content_de", event.target.value)
              }
            />
            <TextareaField
              label="Inhalt Englisch"
              rows={14}
              value={form.content_en}
              onChange={(event) =>
                updateField("content_en", event.target.value)
              }
            />
          </div>
        </FormSection>
      )}

      {activeTab === "media" && (
        <FormSection
          eyebrow="Medien"
          title="News-Bild"
          description="Das Bild wird auf der Startseite, in der Übersicht und später in der Detailansicht verwendet."
        >
          <NewsImageUpload
            imageUrl={form.image_url}
            onUpload={uploadImage}
            onRemove={() => updateField("image_url", "")}
          />
        </FormSection>
      )}

      {activeTab === "documents" && (
        <FormSection
          eyebrow="Dokumente"
          title="Downloads und Anhänge"
          description="Füge der News öffentliche Dokumente wie PDFs, Bilder oder Office-Dateien hinzu."
        >
          <NewsDocumentsManager
            newsId={news?.id}
            documents={documents}
            setDocuments={setDocuments}
            onUploadDocument={handleDocumentUpload}
            onDeleteDocument={handleDocumentDelete}
            loading={documentsLoading}
          />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection
          eyebrow="Einstellungen"
          title="Veröffentlichung"
          description="Steuere, ob die News sofort, geplant oder als Entwurf gespeichert wird."
        >
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(event) =>
                updateField("is_published", event.target.checked)
              }
            />
            Zur Veröffentlichung freigeben
          </label>

          <div className="mt-5">
            <InputField
              label="Veröffentlichungsdatum"
              type="datetime-local"
              value={form.published_at}
              onChange={(event) =>
                updateField("published_at", event.target.value)
              }
            />
            <p className="mt-2 text-sm text-white/40">
              Leer lassen = direkte Veröffentlichung. Datum in der Zukunft =
              geplante Veröffentlichung.
            </p>
          </div>
        </FormSection>
      )}

      <FormActions
        loading={loading}
        submitLabel={isEdit ? "Änderungen speichern" : "News speichern"}
        cancelHref="/admin/news"
      />
    </form>
  );
}
