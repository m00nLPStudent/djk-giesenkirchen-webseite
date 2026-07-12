import { createSlug } from "@/lib/slug";
import { formatDateLocalInput, formatDateTimeLocalInput } from "@/lib/dates";

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
    starts_at: formatDateTimeLocalInput(event?.starts_at),
    ends_at: formatDateTimeLocalInput(event?.ends_at),
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
    recurrence_until: formatDateLocalInput(event?.recurrence_until),
    recurrence_count: event?.recurrence_count ?? "",
    is_published: event?.is_published ?? true,
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
