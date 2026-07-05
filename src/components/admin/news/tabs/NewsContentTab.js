import { FormSection, TextareaField } from "@/components/admin/forms";
import NewsAuthorPanel from "../components/NewsAuthorPanel";
import NewsMetaPanel from "../components/NewsMetaPanel";

export default function NewsContentTab({
  activeTab,
  form,
  teams,
  updateField,
}) {
  if (activeTab === "basic") {
    return <NewsMetaPanel form={form} updateField={updateField} />;
  }

  if (activeTab === "category") {
    return (
      <NewsAuthorPanel form={form} teams={teams} updateField={updateField} />
    );
  }

  if (activeTab === "content") {
    return (
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
            onChange={(event) => updateField("content_de", event.target.value)}
          />
          <TextareaField
            label="Inhalt Englisch"
            rows={14}
            value={form.content_en}
            onChange={(event) => updateField("content_en", event.target.value)}
          />
        </div>
      </FormSection>
    );
  }

  return null;
}
