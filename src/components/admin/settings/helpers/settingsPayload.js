import { createSlug } from "@/lib/slug";

export function normalizeSlug(value = "") {
  return createSlug(value);
}

export function createPreparedPageForm(pageForm = {}) {
  return {
    ...pageForm,
    slug: normalizeSlug(pageForm.slug || pageForm.title_de),
  };
}

export function createMembershipForwardPayload(form = {}, selectedTarget) {
  return {
    forwarded_to_type: form.forwarded_to_type,
    forwarded_to_id: selectedTarget.id,
    forwarded_to_name: selectedTarget.name,
    forwarded_to_email: selectedTarget.email,
    forwarded_note: form.forwarded_note,
  };
}
