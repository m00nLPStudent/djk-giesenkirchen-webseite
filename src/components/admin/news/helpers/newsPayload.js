import { createSlug } from "@/lib/slug";

export function createNewsPayload(form, news) {
  const publishedAt = form.is_published
    ? form.published_at
      ? new Date(form.published_at).toISOString()
      : new Date().toISOString()
    : null;

  return {
    ...form,
    slug: news?.slug || createSlug(form.title_de),
    author: news?.author || "DJK/VfL Giesenkirchen",
    football_team_id:
      form.category_key === "fussball" ? form.football_team_id || null : null,
    is_published: form.is_published,
    published_at: publishedAt,
  };
}
