import { formatDateTimeLocalInput } from "@/lib/dates";
import { getCategoryKeyFromLabel } from "../forms/NewsCategoryFields";

export function createInitialNewsForm(news) {
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
    published_at: formatDateTimeLocalInput(news?.published_at),
  };
}
