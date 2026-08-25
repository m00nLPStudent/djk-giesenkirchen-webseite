import { supabase } from "@/lib/supabase";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";

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

export async function createEvent(event) {
  const payload = { ...event };
  payload.slug = await buildUniqueSlug(event.slug);
  const result = await supabase
    .from("events")
    .insert(payload)
    .select("*")
    .single();
  logAdminSaveEvent({
    module: "events",
    mode: "create",
    step: "service.createEvent",
    operation: "insert",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}

export async function updateEvent(id, event) {
  const payload = { ...event };
  payload.slug = await buildUniqueSlug(event.slug, id);
  const result = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  logAdminSaveEvent({
    module: "events",
    mode: "edit",
    step: "service.updateEvent",
    operation: "update",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}
