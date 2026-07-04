"use client";

import { useMemo, useState } from "react";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import {
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  TextareaField,
} from "@/components/admin/forms";
import AdminRichTextEditor from "@/components/admin/richtext/AdminRichTextEditor";
import { hasMeaningfulRichText } from "@/lib/richtext/sanitize";
import ClubHistoryImagesManager from "../components/ClubHistoryImagesManager";
import ClubHistoryMilestonesManager from "../components/ClubHistoryMilestonesManager";
import {
  CLUB_HISTORY_PAGE_KEY,
  upsertClubHistoryPage,
} from "../services/clubHistory.service";

const TABS = [
  { id: "basic", label: "Grunddaten" },
  { id: "media", label: "Medien" },
  { id: "milestones", label: "Meilensteine" },
  { id: "settings", label: "Einstellungen" },
];

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function createInitialForm(page) {
  return {
    title_de: page?.title_de || "",
    title_en: page?.title_en || "",
    teaser_de: page?.teaser_de || "",
    teaser_en: page?.teaser_en || "",
    content_de: page?.content_de || "",
    content_en: page?.content_en || "",
    is_published: page?.is_published ?? false,
    is_active: page?.is_active ?? true,
    published_at: toDateTimeLocal(page?.published_at),
    sort_order: page?.sort_order ?? 0,
  };
}

export default function ClubHistoryEditorForm({
  page,
  initialImages = [],
  initialMilestones = [],
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(page));
  const [pageId, setPageId] = useState(page?.id || null);
  const [images, setImages] = useState(initialImages);
  const [milestones, setMilestones] = useState(initialMilestones);

  const publishHint = useMemo(() => {
    if (!form.is_published) return "Nicht veröffentlicht";
    if (!form.published_at) return "Wird sofort veröffentlicht";
    return "Veröffentlichung zum gewählten Datum";
  }, [form.is_published, form.published_at]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title_de.trim()) {
      alert("Bitte einen Titel eintragen.");
      setActiveTab("basic");
      return;
    }

    if (!hasMeaningfulRichText(form.content_de)) {
      alert("Bitte den Haupttext eintragen.");
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const payload = {
      page_key: CLUB_HISTORY_PAGE_KEY,
      title_de: form.title_de,
      title_en: form.title_en,
      teaser_de: form.teaser_de,
      teaser_en: form.teaser_en,
      content_de: form.content_de,
      content_en: form.content_en,
      is_published: form.is_published,
      is_active: form.is_active,
      published_at: form.is_published ? toIsoDateTime(form.published_at) : null,
      sort_order: Number(form.sort_order || 0),
    };

    const { data, error } = await upsertClubHistoryPage(payload, pageId);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.id) {
      setPageId(data.id);
      alert("Vereinsgeschichte gespeichert.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "basic" && (
        <FormSection
          eyebrow="Vereinsgeschichte"
          title="Grunddaten"
          description="Pflege Titel, Einleitung und ausführlichen Haupttext der öffentlichen Seite."
        >
          <FormGrid>
            <InputField
              label="Überschrift (DE)"
              required
              value={form.title_de}
              onChange={(event) => updateField("title_de", event.target.value)}
            />
            <InputField
              label="Title (EN)"
              value={form.title_en}
              onChange={(event) => updateField("title_en", event.target.value)}
            />
          </FormGrid>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <TextareaField
              label="Einleitung / Teaser (DE)"
              rows={4}
              value={form.teaser_de}
              onChange={(event) => updateField("teaser_de", event.target.value)}
            />
            <TextareaField
              label="Teaser (EN)"
              rows={4}
              value={form.teaser_en}
              onChange={(event) => updateField("teaser_en", event.target.value)}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <AdminRichTextEditor
              label="Haupttext (DE)"
              required
              value={form.content_de}
              placeholder="Hier den Haupttext der Vereinsgeschichte schreiben..."
              onChange={(nextValue) => updateField("content_de", nextValue)}
            />
            <AdminRichTextEditor
              label="Content (EN)"
              value={form.content_en}
              placeholder="Add the English history content here..."
              onChange={(nextValue) => updateField("content_en", nextValue)}
            />
          </div>
        </FormSection>
      )}

      {activeTab === "media" && (
        <FormSection
          eyebrow="Medien"
          title="Bilder"
          description="Bilder werden über den bestehenden Media-Bucket im Ordner club-history gespeichert."
        >
          <ClubHistoryImagesManager
            pageId={pageId}
            items={images}
            setItems={setImages}
          />
        </FormSection>
      )}

      {activeTab === "milestones" && (
        <FormSection
          eyebrow="Chronik"
          title="Meilensteine"
          description="Füge Jahreszahlen und Ereignisse hinzu und steuere deren Sichtbarkeit."
        >
          <ClubHistoryMilestonesManager
            pageId={pageId}
            items={milestones}
            setItems={setMilestones}
          />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection
          eyebrow="Einstellungen"
          title="Veröffentlichung"
          description="Nur aktive und veröffentlichte Inhalte werden öffentlich angezeigt."
        >
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
              />
              Seite aktiv
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  updateField("is_published", event.target.checked)
                }
              />
              Veröffentlicht
            </label>

            <FormGrid>
              <InputField
                label="Veröffentlichungsdatum"
                type="datetime-local"
                value={form.published_at}
                onChange={(event) =>
                  updateField("published_at", event.target.value)
                }
              />

              <InputField
                label="Sortierung"
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  updateField("sort_order", Number(event.target.value || 0))
                }
              />
            </FormGrid>

            <p className="text-sm text-white/50">Status: {publishHint}</p>
          </div>
        </FormSection>
      )}

      <FormActions
        loading={loading}
        submitLabel="Vereinsgeschichte speichern"
        cancelHref="/admin"
      />
    </form>
  );
}
