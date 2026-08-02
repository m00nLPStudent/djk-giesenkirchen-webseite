import { FormSection, TextareaField } from "@/components/admin/forms";
import NewsAuthorPanel from "../components/NewsAuthorPanel";
import NewsMetaPanel from "../components/NewsMetaPanel";

export default function NewsContentTab({
  activeTab,
  form,
  teams,
  categories,
  updateField,
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
          <TextareaField
            label="Inhalt Deutsch"
            rows={14}
            value={form.content_de}
            onChange={(event) => updateField("content_de", event.target.value)}
          />
        </div>
      </FormSection>
    );
  }

  return null;
}
