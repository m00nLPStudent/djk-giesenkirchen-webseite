import { ROLE_TEMPLATES } from "./settingsOptions";

function parseJsonObject(source, fallback = {}) {
  if (!source) return fallback;
  if (typeof source === "object" && !Array.isArray(source)) return source;
  return fallback;
}

export function createClubSettingsForm(settings) {
  const colors = parseJsonObject(settings?.club_colors, {});
  const socials = parseJsonObject(settings?.social_links, {});

  return {
    club_name: settings?.club_name || "",
    short_name: settings?.short_name || "",
    street: settings?.street || "",
    house_number: settings?.house_number || "",
    postal_code: settings?.postal_code || "",
    city: settings?.city || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    website_url: settings?.website_url || "",
    registry_info: settings?.registry_info || "",
    copyright_text: settings?.copyright_text || "",
    google_maps_url: settings?.google_maps_url || "",
    color_primary: colors.primary || "",
    color_secondary: colors.secondary || "",
    color_accent: colors.accent || "",
    social_facebook: socials.facebook || "",
    social_instagram: socials.instagram || "",
    social_youtube: socials.youtube || "",
    social_tiktok: socials.tiktok || "",
    social_linkedin: socials.linkedin || "",
    social_x: socials.x || "",
  };
}

function findRoleTemplateValue(roleDe = "") {
  const normalized = String(roleDe || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "jugendschutzbeauftragter";

  const found = ROLE_TEMPLATES.find(
    (entry) =>
      entry.value !== "sonstiges" &&
      entry.role_de.trim().toLowerCase() === normalized,
  );

  return found?.value || "sonstiges";
}

export function createInitialContactForm(contact = null) {
  const roleTemplate = findRoleTemplateValue(contact?.role_de || "");

  return {
    category: contact?.category || "allgemein",
    role_template: roleTemplate,
    role_de: contact?.role_de || "",
    role_en: contact?.role_en || "",
    contact_name: contact?.contact_name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    image_url: contact?.image_url || "",
    is_public: contact?.is_public ?? true,
    is_active: contact?.is_active ?? true,
    sort_order: contact?.sort_order ?? 0,
  };
}

export function createInitialPageForm(page = null) {
  return {
    slug: page?.slug || "",
    title_de: page?.title_de || "",
    title_en: page?.title_en || "",
    content_de: page?.content_de || "",
    content_en: page?.content_en || "",
    is_published: page?.is_published ?? false,
    show_in_footer: page?.show_in_footer ?? false,
    sort_order: page?.sort_order ?? 0,
  };
}

export function createInitialMembershipRecipientForm(item = null) {
  return {
    email: item?.email || "",
    label: item?.label || "",
    request_type: item?.request_type || "",
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order ?? 0,
  };
}

export function createInitialMembershipRequestForm(item = null) {
  return {
    status: item?.status || "new",
    internal_note: item?.internal_note || "",
    forwarded_to_type: item?.forwarded_to_type || "",
    forwarded_to_id: item?.forwarded_to_id || "",
    forwarded_note: item?.forwarded_note || "",
  };
}

function getPersonDisplayName(person = {}) {
  return (
    `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
    person.name ||
    "Unbekannte Person"
  );
}

function getCoachOptionLabel(coach) {
  const name = getPersonDisplayName(coach);
  const role = coach?.role_de || coach?.role || "Trainer";
  const team = coach?.teams?.name_de || "Ohne Mannschaft";
  return `${name} · ${role} · ${team}`;
}

function getBoardOptionLabel(member) {
  const name = getPersonDisplayName(member);
  const role = member?.role_de || "Vorstand";
  return `${name} · ${role}`;
}

export function getForwardTargets(type, coaches = [], boardMembers = []) {
  if (type === "coach") {
    return coaches.map((coach) => ({
      id: coach.id,
      name: getPersonDisplayName(coach),
      email: coach.email || "",
      label: getCoachOptionLabel(coach),
    }));
  }

  if (type === "board") {
    return boardMembers.map((member) => ({
      id: member.id,
      name: getPersonDisplayName(member),
      email: member.email || "",
      label: getBoardOptionLabel(member),
    }));
  }

  return [];
}

export function formatRequestDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function sortedByOrder(items) {
  return [...items].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
}
