import { AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";
import { getNewsCategoryDisplay } from "@/components/website/news/NewsCard";

const formatDate = (value) => value ? new Date(value).toLocaleString("de-DE") : "–";

export default function NewsDetailSummary({ news }) {
  const documents = news.news_documents || [];

  return (
    <>
      <AdminInformationSection title="Inhalt"><AdminInformationRow label="Kategorie">{getNewsCategoryDisplay(news)}</AdminInformationRow><AdminInformationRow label="Autor">{news.author || "Autor nicht hinterlegt"}</AdminInformationRow><AdminInformationRow label="Teaser">{news.teaser_de}</AdminInformationRow><AdminInformationRow label="Inhalt">{news.content_de}</AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="SEO"><AdminInformationRow label="Slug">{news.slug}</AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Bilder"><AdminInformationRow label="Titelbild">{news.image_url ? "Bild hinterlegt" : "–"}</AdminInformationRow><AdminInformationRow label="Dokumente">{documents.length}</AdminInformationRow></AdminInformationSection>
      <AdminInformationSection title="Historie"><AdminInformationRow label="Erstellt am">{formatDate(news.created_at)}</AdminInformationRow><AdminInformationRow label="Geändert am">{formatDate(news.updated_at)}</AdminInformationRow><AdminInformationRow label="Veröffentlicht am">{formatDate(news.published_at)}</AdminInformationRow></AdminInformationSection>
    </>
  );
}
