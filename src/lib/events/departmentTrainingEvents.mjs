const SAFE_DEPARTMENT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

export function selectPublishedDepartmentTrainingSlots(
  trainingTimes = [],
  departments = [],
  sections = [],
) {
  const departmentMap = new Map(
    departments
      .filter((department) => department?.id && department.is_active === true)
      .map((department) => [department.id, department]),
  );
  const sectionMap = new Map(
    sections
      .filter(
        (section) =>
          section?.department_id &&
          section.is_active === true &&
          section.is_published === true,
      )
      .map((section) => [section.department_id, section]),
  );

  return trainingTimes.flatMap((slot) => {
    if (!slot?.id || slot.is_active !== true || !slot.department_id) return [];

    const department = departmentMap.get(slot.department_id);
    const section = sectionMap.get(slot.department_id);
    const departmentSlug = text(department?.slug)?.toLowerCase();
    const displayName = text(section?.title_de) || text(department?.name_de);

    if (!department || !section || !displayName || !SAFE_DEPARTMENT_SLUG.test(departmentSlug || "")) return [];

    return [{
      ...slot,
      source_type: "department_training",
      department_slug: departmentSlug,
      department_name_de: text(department.name_de),
      display_name_de: displayName,
      department_href: `/${departmentSlug}`,
    }];
  });
}

export function mergeTrainingOccurrenceStreams(...streams) {
  return streams
    .flat()
    .filter((event) => Number.isFinite(new Date(event?.starts_at).getTime()))
    .sort(
      (left, right) =>
        new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    );
}
