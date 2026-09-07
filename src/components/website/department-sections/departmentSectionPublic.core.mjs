export const DEPARTMENT_SECTION_PLACEHOLDER = "/images/sports-icons/adaptive-sports.png";

const WEEKDAYS = new Map([
  [1, "Montag"], [2, "Dienstag"], [3, "Mittwoch"], [4, "Donnerstag"],
  [5, "Freitag"], [6, "Samstag"], [7, "Sonntag"],
]);

const text = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const time = (value) => text(value)?.slice(0, 5) || null;

export function createPublicDepartmentSectionDto(section, trainingRows = [], imageUrl = null, options = {}) {
  if (!section?.department_slug || !text(section.title_de)) return null;
  const contactIsPublic = section.contact_is_public === true;
  return {
    section: {
      title: text(section.title_de),
      description: text(section.description_de),
      imageUrl: imageUrl || null,
    },
    contact: {
      public: contactIsPublic,
      name: contactIsPublic ? text(section.contact_name) : null,
      email: contactIsPublic ? text(section.contact_email) : null,
      phone: contactIsPublic ? text(section.contact_phone) : null,
    },
    trainingTimes: selectPublicDepartmentTraining(trainingRows, options).map(normalizePublicDepartmentTraining).filter(Boolean),
  };
}

export function selectPublicDepartmentTraining(rows = [], { departmentId, today = new Date().toISOString().slice(0, 10) } = {}) {
  if (!departmentId) return [];
  return rows.filter((row) => row?.department_id === departmentId
    && row.is_active === true
    && (!row.effective_from || row.effective_from <= today)
    && (!row.effective_until || row.effective_until >= today));
}

export function normalizePublicDepartmentTraining(row) {
  const weekday = Number(row?.weekday);
  const startTime = time(row?.start_time);
  const endTime = time(row?.end_time);
  if (!WEEKDAYS.has(weekday) || !startTime || !endTime) return null;
  return {
    weekday: WEEKDAYS.get(weekday),
    weekdayNumber: weekday,
    startTime,
    endTime,
    location: text(row.location_name),
    address: text(row.location_address),
    city: text(row.location_city),
    note: text(row.location_note),
  };
}
