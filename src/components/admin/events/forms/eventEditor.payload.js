function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function buildEventPayload({ form, publicSlug, hasRecurrence }) {
  return {
    title_de: form.title_de.trim(),
    title_en: form.title_en.trim() || null,
    teaser_de: form.teaser_de.trim() || null,
    teaser_en: form.teaser_en.trim() || null,
    description_de: form.description_de.trim() || null,
    description_en: form.description_en.trim() || null,
    event_type: form.event_type,
    starts_at: toIsoOrNull(form.starts_at),
    ends_at: toIsoOrNull(form.ends_at),
    is_all_day: Boolean(form.is_all_day),
    location_name: form.location_name.trim() || null,
    location_address: form.location_address.trim() || null,
    location_city: form.location_city.trim() || null,
    team_id: form.team_id || null,
    external_url: form.external_url.trim() || null,
    image_url: form.image_url || null,
    slug: publicSlug || null,
    recurrence_type: hasRecurrence ? form.recurrence_type : "none",
    recurrence_interval: hasRecurrence
      ? Math.max(1, Number(form.recurrence_interval || 1))
      : null,
    recurrence_until:
      hasRecurrence && form.recurrence_until
        ? toIsoOrNull(`${form.recurrence_until}T23:59`)
        : null,
    recurrence_count:
      hasRecurrence && form.recurrence_count !== ""
        ? Math.max(1, Number(form.recurrence_count || 1))
        : null,
    is_published: Boolean(form.is_published),
    is_featured: Boolean(form.is_featured),
    sort_order: Number(form.sort_order || 0),
  };
}
