import { formatDateTimeLocalInput } from "@/lib/dates";
import { getCategoryKeyFromLabel } from "../forms/NewsCategoryFields";

export function createInitialNewsForm(news) {
  const category = news?.category || "Allgemein";

  return {
    title_de: news?.title_de || "",
    teaser_de: news?.teaser_de || "",
    content_de: news?.content_de || "",
    category,
    category_key: news?.category_key || getCategoryKeyFromLabel(category),
    football_team_id: news?.football_team_id || "",
    image_url: news?.image_url || "",
    is_published: news?.is_published ?? true,
    published_at: formatDateTimeLocalInput(news?.published_at),
  };
}
