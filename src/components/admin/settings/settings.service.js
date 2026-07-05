import { supabase } from "@/lib/supabase";
import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";
import { createSlug } from "@/lib/slug";

export const CLUB_CONTACT_PLACEHOLDER_IMAGE = "";

function normalizeText(value) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function createRoleKey(form = {}) {
  const rawRole = normalizeText(form.role_de);
  const rawName = normalizeText(form.contact_name);
  return createSlug(rawRole || rawName || "kontakt");
}

export function normalizeClubSettingsForm(form = {}) {
  return {
    club_name: String(form.club_name || "").trim(),
    short_name: normalizeText(form.short_name),
    street: normalizeText(form.street),
    house_number: normalizeText(form.house_number),
    postal_code: normalizeText(form.postal_code),
    city: normalizeText(form.city),
    phone: normalizeText(form.phone),
    email: normalizeText(form.email),
    website_url: normalizeText(form.website_url),
    registry_info: normalizeText(form.registry_info),
    copyright_text: normalizeText(form.copyright_text),
    google_maps_url: normalizeText(form.google_maps_url),
    club_colors: {
      primary: normalizeText(form.color_primary),
      secondary: normalizeText(form.color_secondary),
      accent: normalizeText(form.color_accent),
    },
    social_links: {
      facebook: normalizeText(form.social_facebook),
      instagram: normalizeText(form.social_instagram),
      youtube: normalizeText(form.social_youtube),
      tiktok: normalizeText(form.social_tiktok),
      linkedin: normalizeText(form.social_linkedin),
      x: normalizeText(form.social_x),
    },
  };
}

export async function saveClubSettings(form, id = null) {
  const payload = normalizeClubSettingsForm(form);

  if (!payload.club_name) {
    return {
      data: null,
      error: { message: "Der Vereinsname ist erforderlich." },
    };
  }

  const effectiveId =
    id ||
    (
      await supabase
        .from("club_settings")
        .select("id")
        .eq("singleton", true)
        .maybeSingle()
    )?.data?.id ||
    null;

  if (effectiveId) {
    return await supabase
      .from("club_settings")
      .update(payload)
      .eq("id", effectiveId)
      .eq("singleton", true)
      .select("*")
      .maybeSingle();
  }

  return await supabase
    .from("club_settings")
    .insert({ ...payload, singleton: true })
    .select("*")
    .maybeSingle();
}

export function normalizeClubContactPayload(form = {}) {
  return {
    category: String(form.category || "allgemein").trim() || "allgemein",
    role_key: createRoleKey(form),
    role_de: String(form.role_de || "").trim(),
    role_en: normalizeText(form.role_en),
    contact_name: String(form.contact_name || "").trim(),
    email: normalizeText(form.email),
    phone: normalizeText(form.phone),
    image_url: normalizeText(form.image_url),
    is_public: Boolean(form.is_public),
    is_active: Boolean(form.is_active),
    sort_order: Number(form.sort_order || 0),
  };
}

export async function uploadClubContactImage(file, contact = {}) {
  return await uploadMediaFile(file, {
    folder: "club-contacts",
    name: `${contact.role_de || contact.contact_name || "kontakt"}-${contact.id || Date.now()}`,
    previousUrl: contact.image_url,
    ignoredUrls: [CLUB_CONTACT_PLACEHOLDER_IMAGE],
  });
}

export async function deleteClubContactImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [CLUB_CONTACT_PLACEHOLDER_IMAGE],
  });
}

export async function createClubContact(form) {
  return await supabase
    .from("club_contacts")
    .insert(normalizeClubContactPayload(form))
    .select("*")
    .maybeSingle();
}

export async function updateClubContact(id, form) {
  return await supabase
    .from("club_contacts")
    .update(normalizeClubContactPayload(form))
    .eq("id", id)
    .select("*")
    .maybeSingle();
}

export async function deleteClubContact(id) {
  return await supabase.from("club_contacts").delete().eq("id", id);
}

export function normalizePagePayload(form = {}) {
  return {
    slug: String(form.slug || "")
      .trim()
      .toLowerCase(),
    title_de: String(form.title_de || "").trim(),
    title_en: normalizeText(form.title_en),
    content_de: form.content_de || "",
    content_en: form.content_en || "",
    is_published: Boolean(form.is_published),
    show_in_footer: Boolean(form.show_in_footer),
    sort_order: Number(form.sort_order || 0),
  };
}

export async function createPage(form) {
  return await supabase
    .from("pages")
    .insert(normalizePagePayload(form))
    .select("*")
    .maybeSingle();
}

export async function updatePage(id, form) {
  return await supabase
    .from("pages")
    .update(normalizePagePayload(form))
    .eq("id", id)
    .select("*")
    .maybeSingle();
}

export async function savePage(form, id = null) {
  const payload = normalizePagePayload(form);

  if (!payload.slug) {
    return {
      data: null,
      error: { message: "Der Slug ist erforderlich." },
    };
  }

  if (id) {
    return await updatePage(id, payload);
  }

  const existingBySlugResult = await supabase
    .from("pages")
    .select("id")
    .eq("slug", payload.slug)
    .maybeSingle();

  if (existingBySlugResult.error) {
    return existingBySlugResult;
  }

  const existingId = existingBySlugResult.data?.id || null;
  if (existingId) {
    return await updatePage(existingId, payload);
  }

  return await createPage(payload);
}

export async function deletePage(id) {
  return await supabase.from("pages").delete().eq("id", id);
}

export function normalizeMembershipRecipientPayload(form = {}) {
  const requestType = normalizeText(form.request_type);

  return {
    email: String(form.email || "").trim(),
    label: normalizeText(form.label),
    request_type: requestType || null,
    is_active: Boolean(form.is_active),
    sort_order: Number(form.sort_order || 0),
  };
}

export async function createMembershipRecipient(form) {
  return await supabase
    .from("membership_request_recipients")
    .insert(normalizeMembershipRecipientPayload(form))
    .select("*")
    .maybeSingle();
}

export async function updateMembershipRecipient(id, form) {
  return await supabase
    .from("membership_request_recipients")
    .update(normalizeMembershipRecipientPayload(form))
    .eq("id", id)
    .select("*")
    .maybeSingle();
}

export async function deleteMembershipRecipient(id) {
  return await supabase
    .from("membership_request_recipients")
    .delete()
    .eq("id", id);
}
