import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { normalizeGermanPhoneNumber } from "@/lib/phone";
import { createSlug } from "../utils/slug";
import { REQUIRED_COACH_FIELDS } from "./coachForm.config";

export function splitCoachName(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function createInitialCoachForm(coach) {
  const fallbackName = splitCoachName(coach?.name);

  return {
    first_name: coach?.first_name || fallbackName.firstName,
    last_name: coach?.last_name || fallbackName.lastName,
    name: coach?.name || "",
    slug: coach?.slug || "",
    role: coach?.role || "Trainer",
    email: coach?.email || "",
    phone: coach?.phone || "",
    whatsapp: coach?.whatsapp || "",
    license: coach?.license || "Keine Lizenz",
    team_id: coach?.team_id || "",
    nationality: coach?.nationality || "",
    image_url: coach?.image_url || COACH_PLACEHOLDER_IMAGE,
    sort_order: coach?.sort_order || 0,
    is_active: coach?.is_active ?? true,
  };
}

export function validateCoachForm(form) {
  const errors = {};

  Object.entries(REQUIRED_COACH_FIELDS).forEach(([field, label]) => {
    if (!String(form[field] || "").trim()) {
      errors[field] = `${label} ist ein Pflichtfeld.`;
    }
  });

  return errors;
}

export function createCoachPayload(form) {
  const fullName = `${form.first_name} ${form.last_name}`.trim();

  return {
    ...form,
    name: fullName,
    slug: form.slug || createSlug(fullName),
    phone: normalizeGermanPhoneNumber(form.phone),
    whatsapp: normalizeGermanPhoneNumber(form.whatsapp),
    image_url: form.image_url || COACH_PLACEHOLDER_IMAGE,
    team_id: form.team_id || null,
    sort_order: Number(form.sort_order),
    is_active: form.is_active,
  };
}
