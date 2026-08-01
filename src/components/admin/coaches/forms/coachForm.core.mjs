const COACH_ROLE_EN = {
  Trainer: "Coach",
  "Co-Trainer": "Assistant Coach",
  Betreuer: "Supervisor",
  Torwarttrainer: "Goalkeeper Coach",
  Cheftrainer: "Head Coach",
};

export function toRoleEn(roleDe) {
  return COACH_ROLE_EN[String(roleDe || "").trim()] || null;
}

export function createCoachAssignmentDraft(role = "") {
  return {
    coach_team_season_id: null,
    team_season_id: "",
    role_de: role,
    role_en: toRoleEn(role),
    assignment_sort_order: 0,
    is_active: true,
  };
}

export function findLegacyTeamSeasonOption(readModel, teamOptions = []) {
  if (!readModel?.legacyFallbackUsed || !readModel?.legacyTeamId) return null;
  return (
    teamOptions.find((option) => option.teamId === readModel.legacyTeamId) || null
  );
}

export function getLegacyFallbackRole(coach = {}, fallback = "Trainer") {
  return coach?.role_de || coach?.role || fallback;
}

export function createCoachAssignmentsFromReadModel(
  readModel,
  teamOptions,
  coach,
) {
  if ((readModel?.assignments || []).length > 0) {
    return readModel.assignments.map((assignment) => ({
      coach_team_season_id: assignment.coachTeamSeasonId,
      team_season_id: assignment.teamSeasonId,
      role_de: assignment.roleDe || "",
      role_en: assignment.roleEn || toRoleEn(assignment.roleDe),
      assignment_sort_order: assignment.sortOrder ?? 0,
      is_active: assignment.isActive !== false,
    }));
  }

  const legacyOption = findLegacyTeamSeasonOption(readModel, teamOptions);
  if (!legacyOption) return [];

  const legacyRole = getLegacyFallbackRole(coach);
  return [
    {
      coach_team_season_id: null,
      team_season_id: legacyOption.teamSeasonId,
      role_de: legacyRole,
      role_en: toRoleEn(legacyRole),
      assignment_sort_order: coach?.sort_order ?? 0,
      is_active: true,
    },
  ];
}

export function createInitialCoachFormState(
  coach,
  coachSeasonalReadModel,
  teamOptions = [],
  { placeholderImage } = {},
) {
  const assignments = createCoachAssignmentsFromReadModel(
    coachSeasonalReadModel,
    teamOptions,
    coach,
  );
  const fallbackRole =
    coach?.role_de || coach?.role || (assignments.length === 0 ? "Trainer" : "");

  return {
    first_name: coach?.first_name || "",
    last_name: coach?.last_name || "",
    name: coach?.name || "",
    slug: coach?.slug || "",
    role: fallbackRole,
    email: coach?.email || "",
    phone: coach?.phone || "",
    whatsapp: coach?.whatsapp || "",
    license: coach?.license || "Keine Lizenz",
    nationality: coach?.nationality || "",
    image_url: coach?.image_url || coach?.photo_url || placeholderImage,
    sort_order: coach?.sort_order ?? 0,
    is_active: coach?.is_active ?? true,
    assignments,
  };
}

function validateRequiredFields(form, requiredFields = {}) {
  return Object.entries(requiredFields).reduce((errors, [field, label]) => {
    if (!String(form?.[field] || "").trim()) {
      errors[field] = `${label} ist erforderlich.`;
    }
    return errors;
  }, {});
}

export function validateCoachFormState(form, requiredFields = {}) {
  const errors = validateRequiredFields(form, requiredFields);
  const assignments = form?.assignments || [];
  const duplicateTeamSeasonIds = new Set();

  if (assignments.length === 0 && !String(form?.role || "").trim()) {
    errors.role = "Bitte hinterlege fuer teamlose Trainer eine Fallback-Funktion.";
  }

  for (const assignment of assignments) {
    const teamSeasonId = String(assignment?.team_season_id || "").trim();
    const roleDe = String(assignment?.role_de || "").trim();

    if (!teamSeasonId || !roleDe) {
      errors.assignments =
        "Jede Trainerzuordnung braucht eine Mannschaft und eine Rolle.";
      return errors;
    }

    if (duplicateTeamSeasonIds.has(teamSeasonId)) {
      errors.assignments =
        "Dieselbe Mannschaft darf im Trainerformular nur einmal ausgewaehlt werden.";
      return errors;
    }
    duplicateTeamSeasonIds.add(teamSeasonId);
  }

  return errors;
}

export function createCoachSubmissionPayload(
  form,
  {
    createSlug = (value) => value,
    normalizeGermanPhoneNumber = (value) => value,
    placeholderImage = null,
  } = {},
) {
  const fullName = `${form.first_name} ${form.last_name}`.trim();
  const fallbackRole = String(form.role || "").trim();

  return {
    ...form,
    name: fullName,
    slug: form.slug || createSlug(fullName),
    phone: normalizeGermanPhoneNumber(form.phone),
    whatsapp: normalizeGermanPhoneNumber(form.whatsapp),
    image_url: form.image_url || placeholderImage,
    role: fallbackRole,
    role_de: fallbackRole || null,
    role_en: fallbackRole ? toRoleEn(fallbackRole) : null,
    sort_order: Number(form.sort_order || 0),
    is_active: form.is_active,
    assignments: (form.assignments || []).map((assignment) => ({
      coach_team_season_id: assignment.coach_team_season_id || null,
      team_season_id: assignment.team_season_id || null,
      role_de: assignment.role_de || "",
      role_en: assignment.role_en || toRoleEn(assignment.role_de),
      assignment_sort_order: Number(assignment.assignment_sort_order || 0),
      is_active: assignment.is_active !== false,
    })),
  };
}
