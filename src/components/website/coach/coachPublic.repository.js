import "server-only";

import {
  createCoachReadDto,
  createCoachTeamView,
} from "@/components/admin/persons/coachReadDto";
import {
  getCoachSeasonalReadModel,
  getCoachSeasonalReadModelsMap,
} from "@/components/admin/persons/coachSeasonalReadModelRepository";

const PUBLIC_COACH_SELECT =
  "id, first_name, last_name, name, slug, role, role_de, role_en, email, phone, whatsapp, license, nationality, image_url, photo_url, is_active, sort_order, department_id";

function sortByName(a, b) {
  return String(a.displayName || "").localeCompare(String(b.displayName || ""));
}

function sortByTeamAssignment(a, b) {
  const firstSortOrder = a.teamAssignments[0]?.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const secondSortOrder =
    b.teamAssignments[0]?.sortOrder ?? Number.MAX_SAFE_INTEGER;

  return firstSortOrder - secondSortOrder || sortByName(a, b);
}

function mapCoachDtos(coaches = [], readModels = new Map()) {
  return (coaches || []).map((coach) =>
    createCoachReadDto(coach, readModels.get(coach.id) || {}),
  );
}

export async function loadActivePublicCoachDtos(
  supabaseServer,
  { getReadModelsMap = getCoachSeasonalReadModelsMap, departmentId = null } = {},
) {
  let query = supabaseServer
    .from("coaches")
    .select(PUBLIC_COACH_SELECT)
    .eq("is_active", true);
  if (departmentId) query = query.eq("department_id", departmentId);
  const { data: coaches, error } = await query.order("sort_order", { ascending: true });

  if (error) {
    throw new Error(
      `coaches query failed in loadActivePublicCoachDtos: ${error.message}`,
    );
  }

  const coachList = coaches || [];
  const coachIds = coachList.map((coach) => coach.id).filter(Boolean);
  const readModels = await getReadModelsMap(supabaseServer, coachIds);

  return mapCoachDtos(coachList, readModels);
}

export async function loadPublicCoachBySlug(
  supabaseServer,
  slug,
  { getReadModel = getCoachSeasonalReadModel } = {},
) {
  const { data: coach, error } = await supabaseServer
    .from("coaches")
    .select(PUBLIC_COACH_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `coaches query failed in loadPublicCoachBySlug: ${error.message}`,
    );
  }

  if (!coach?.id) {
    return null;
  }

  const readModel = await getReadModel(supabaseServer, coach.id);
  return createCoachReadDto(coach, readModel);
}

export async function loadPublicCoachDtosByIds(
  supabaseServer,
  coachIds = [],
  { getReadModelsMap = getCoachSeasonalReadModelsMap, departmentId = null } = {},
) {
  const uniqueCoachIds = Array.from(new Set((coachIds || []).filter(Boolean)));
  if (uniqueCoachIds.length === 0) {
    return [];
  }

  let query = supabaseServer
    .from("coaches")
    .select(PUBLIC_COACH_SELECT)
    .in("id", uniqueCoachIds)
    .eq("is_active", true);
  if (departmentId) query = query.eq("department_id", departmentId);
  const { data: coaches, error } = await query;

  if (error) {
    throw new Error(
      `coaches query failed in loadPublicCoachDtosByIds: ${error.message}`,
    );
  }

  const readModels = await getReadModelsMap(
    supabaseServer,
    uniqueCoachIds,
  );

  return mapCoachDtos(coaches || [], readModels).sort(sortByName);
}

export function mapCoachDtosForTeam(coaches = [], teamId = null) {
  return (coaches || [])
    .map((coach) => createCoachTeamView(coach, teamId))
    .filter((coach) => coach.teamAssignments.length > 0)
    .sort(sortByTeamAssignment);
}
