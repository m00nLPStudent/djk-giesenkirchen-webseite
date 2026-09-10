export const DEPARTMENT_SECTION_CONFIGS = Object.freeze({
  behindertensport: Object.freeze({
    slug: "behindertensport",
    label: "Behindertensport",
    defaultTitle: "Behindertensport",
    adminPath: "/admin/behindertensport",
  }),
  gymnastikdamen: Object.freeze({
    slug: "damen-gymnastik",
    label: "Gymnastikdamen",
    defaultTitle: "Gymnastikdamen",
    adminPath: "/admin/gymnastikdamen",
  }),
});

const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const optional = (value, max) => clean(value, max) || null;

export function normalizeDepartmentSectionPayload(input = {}) {
  const contactIsPublic = input.contact_is_public === true;
  const payload = {
    title_de: clean(input.title_de, 200),
    description_de: clean(input.description_de, 20000),
    contact_name: optional(input.contact_name, 200),
    contact_email: optional(input.contact_email, 320),
    contact_phone: optional(input.contact_phone, 80),
    contact_is_public: contactIsPublic,
    is_active: input.is_active !== false,
    is_published: input.is_published === true,
  };
  if (!payload.title_de) return { ok: false, error: "Bitte einen Titel eingeben." };
  if (payload.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contact_email)) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }
  if (contactIsPublic && !payload.contact_name) {
    return { ok: false, error: "Für öffentliche Kontaktdaten ist ein Name erforderlich." };
  }
  if (contactIsPublic && !payload.contact_email && !payload.contact_phone) {
    return { ok: false, error: "Für öffentliche Kontaktdaten ist eine E-Mail-Adresse oder Telefonnummer erforderlich." };
  }
  return { ok: true, data: payload };
}

export function normalizeDepartmentTrainingPayload(input = {}) {
  const weekday = Number(input.weekday);
  const startTime = clean(input.start_time, 8);
  const endTime = clean(input.end_time, 8);
  const effectiveFrom = optional(input.effective_from, 10);
  const effectiveUntil = optional(input.effective_until, 10);
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    return { ok: false, error: "Bitte einen gültigen Wochentag auswählen." };
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(startTime) || !/^\d{2}:\d{2}(:\d{2})?$/.test(endTime) || startTime >= endTime) {
    return { ok: false, error: "Die Endzeit muss nach der Startzeit liegen." };
  }
  if (effectiveFrom && effectiveUntil && effectiveUntil < effectiveFrom) {
    return { ok: false, error: "Das Gültig-bis-Datum darf nicht vor dem Startdatum liegen." };
  }
  return {
    ok: true,
    data: {
      weekday,
      start_time: startTime,
      end_time: endTime,
      location_name: optional(input.location_name, 200),
      location_address: optional(input.location_address, 300),
      location_city: optional(input.location_city, 160),
      location_note: optional(input.location_note, 1000),
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      is_active: input.is_active !== false,
      sort_order: Math.min(Math.max(Number.parseInt(input.sort_order, 10) || 0, 0), 1000000),
    },
  };
}
