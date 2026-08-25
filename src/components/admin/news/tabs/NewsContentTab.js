import { FormSection } from "@/components/admin/forms";
import NewsInlineMediaEditor from "../components/NewsInlineMediaEditor";
import NewsAuthorPanel from "../components/NewsAuthorPanel";
import NewsMetaPanel from "../components/NewsMetaPanel";

export default function NewsContentTab({
  activeTab,
  form,
  teams,
  categories,
  updateField,
  inlineMedia,
}) {
  if (activeTab === "basic") {
    return <NewsMetaPanel form={form} updateField={updateField} />;
  }

  if (activeTab === "category") {
    return (
      <NewsAuthorPanel form={form} teams={teams} categories={categories} updateField={updateField} />
    );
  }

  if (activeTab === "content") {
    return (
      <FormSection
        eyebrow="Inhalt"
        title="News-Inhalt"
        description="Der vollständige Text für die spätere Detailseite."
      >
        <div>
          <NewsInlineMediaEditor
            id="news-content-de"
            name="content_de"
            label="Inhalt Deutsch"
            value={form.content_de}
            onChange={(value) => updateField("content_de", value)}
            minHeight={360}
            helpText="Formatierter Hauptinhalt der öffentlichen News-Detailseite."
            inlineMedia={inlineMedia}
          />
        </div>
      </FormSection>
    );
  }

  return null;
}
