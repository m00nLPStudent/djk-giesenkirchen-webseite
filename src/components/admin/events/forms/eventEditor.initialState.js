import { createSlug } from "@/lib/slug";

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatDateLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function createInitialEventForm(event) {
  const initialSlug = event?.slug || createSlug(event?.title_de || "");

  return {
    title_de: event?.title_de || "",
    title_en: event?.title_en || "",
    teaser_de: event?.teaser_de || "",
    teaser_en: event?.teaser_en || "",
    description_de: event?.description_de || "",
    description_en: event?.description_en || "",
    event_type: event?.event_type || "vereinstermin",
    starts_at: formatDateTimeLocal(event?.starts_at),
    ends_at: formatDateTimeLocal(event?.ends_at),
    is_all_day: event?.is_all_day ?? false,
    location_name: event?.location_name || "",
    location_address: event?.location_address || "",
    location_city: event?.location_city || "",
    team_id: event?.team_id || "",
    external_url: event?.external_url || "",
    image_url: event?.image_url || "",
    slug: initialSlug,
    recurrence_type: event?.recurrence_type || "none",
    recurrence_interval: event?.recurrence_interval ?? 1,
    recurrence_until: formatDateLocal(event?.recurrence_until),
    recurrence_count: event?.recurrence_count ?? "",
    is_published: event?.is_published ?? false,
    is_featured: event?.is_featured ?? false,
    sort_order: event?.sort_order ?? 0,
  };
}

export function sortDocuments(items = []) {
  return [...items].sort((a, b) => {
    const sortA = a.sort_order || 0;
    const sortB = b.sort_order || 0;
    if (sortA !== sortB) return sortA - sortB;
    return (
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime()
    );
  });
}
