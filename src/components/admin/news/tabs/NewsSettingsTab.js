import NewsPublishPanel from "../components/NewsPublishPanel";

export default function NewsSettingsTab({ activeTab, form, updateField }) {
  if (activeTab !== "settings") {
    return null;
  }

  return <NewsPublishPanel form={form} updateField={updateField} />;
}
