import { supabase } from "@/lib/supabase";
import {
  getStoragePublicUrl,
  removeStorageFiles,
  uploadStorageFile,
  uploadMediaFile,
} from "@/lib/storage";
import {
  ALLOWED_DOCUMENT_TYPES,
  deriveDisplayName,
  getFileExtension,
} from "@/lib/files";

function normalizeSlugValue(slug) {
  if (!slug) return "";
  const value = String(slug).trim();
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function slugExists(slug, ignoreId = null) {
  if (!slug) return false;

  let query = supabase.from("events").select("id").eq("slug", slug).limit(1);
  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;
  if (error) return false;
  return Boolean(data?.length);
}

async function buildUniqueSlug(slug, ignoreId = null) {
  if (!slug) return null;
  const baseSlug = slug;
  let candidate = baseSlug;
  let suffix = 2;

  while (await slugExists(candidate, ignoreId)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function getAdminEvents() {
  return await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true })
    .order("created_at", { ascending: false });
}

export async function getPublishedEvents() {
  return await supabase
    .from("events")
    .select("*, team:team_id(name_de, slug)")
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .order("created_at", { ascending: false });
}

export async function getPublishedEventBySlug(slug) {
  const normalizedSlug = normalizeSlugValue(slug);
  if (!normalizedSlug) return { data: null, error: null };

  return await supabase
    .from("events")
    .select("*, team:team_id(name_de, slug), event_documents(*)")
    .eq("slug", normalizedSlug)
    .eq("is_published", true)
    .maybeSingle();
}

export async function diagnoseEventLookupBySlug(slug) {
  const normalizedSlug = normalizeSlugValue(slug);
  if (!normalizedSlug) {
    return {
      reason: "missing_slug_param",
      event: null,
      error: null,
      slug: normalizedSlug,
    };
  }

  const { data: publishedEvent, error: publishedError } = await supabase
    .from("events")
    .select("id, slug, is_published")
    .eq("slug", normalizedSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (publishedEvent) {
    return {
      reason: "ok",
      event: publishedEvent,
      error: null,
      slug: normalizedSlug,
    };
  }

  if (publishedError) {
    return {
      reason: "published_query_error",
      event: null,
      error: publishedError,
      slug: normalizedSlug,
    };
  }

  const { data: anyEvent, error: anyError } = await supabase
    .from("events")
    .select("id, slug, is_published")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (anyError) {
    return {
      reason: "fallback_query_error",
      event: null,
      error: anyError,
      slug: normalizedSlug,
    };
  }

  if (!anyEvent) {
    return {
      reason: "slug_not_found",
      event: null,
      error: null,
      slug: normalizedSlug,
    };
  }

  return {
    reason: "event_not_published",
    event: anyEvent,
    error: null,
    slug: normalizedSlug,
  };
}

export async function getUpcomingPublishedEvents(limit = 5) {
  return await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
}

export async function uploadEventImage(file, event = {}) {
  return await uploadMediaFile(file, {
    folder: "events",
    name: `${event.title_de || "event"}-${event.id || Date.now()}`,
    previousUrl: event.image_url,
  });
}

export async function getEventDocuments(eventId) {
  if (!eventId) return { data: [], error: null };

  return await supabase
    .from("event_documents")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function uploadEventDocument(file, eventId) {
  if (!file || !eventId) return { data: null, error: null };

  const extension = getFileExtension(file.name);
  if (!ALLOWED_DOCUMENT_TYPES.includes(extension)) {
    return {
      data: null,
      error: { message: "Dieser Dateityp ist nicht erlaubt." },
    };
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const path = `${eventId}/${fileName}`;

  const { error: uploadError } = await uploadStorageFile(
    "events-documents",
    path,
    file,
    {
      cacheControl: "3600",
      upsert: false,
    },
  );

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const publicUrlData = getStoragePublicUrl("events-documents", path);

  const payload = {
    event_id: eventId,
    file_name: file.name,
    file_path: path,
    display_name_de: deriveDisplayName(file.name),
    display_name_en: null,
    description_de: null,
    description_en: null,
    file_url: publicUrlData.publicUrl,
    mime_type: file.type || `application/${extension}`,
    file_size: file.size,
    is_public: true,
    sort_order: 0,
  };

  const { data, error } = await supabase
    .from("event_documents")
    .insert(payload)
    .select("*")
    .single();

  return { data, error };
}

export async function updateEventDocument(id, updates) {
  if (!id) return { data: null, error: null };

  return await supabase
    .from("event_documents")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();
}

export async function deleteEventDocument(documentItem) {
  if (!documentItem?.id) return { data: null, error: null };

  const storagePath = documentItem.file_path
    ? decodeURIComponent(documentItem.file_path)
    : null;

  if (storagePath) {
    const { error: storageError } = await removeStorageFiles(
      "events-documents",
      [storagePath],
    );
    if (storageError) {
      return { data: null, error: storageError };
    }
  }

  return await supabase
    .from("event_documents")
    .delete()
    .eq("id", documentItem.id);
}

export async function createEvent(event) {
  const payload = { ...event };
  payload.slug = await buildUniqueSlug(event.slug);
  return await supabase.from("events").insert(payload).select("*").single();
}

export async function updateEvent(id, event) {
  const payload = { ...event };
  payload.slug = await buildUniqueSlug(event.slug, id);

  return await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
}
