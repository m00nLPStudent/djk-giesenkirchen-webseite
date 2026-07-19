import {
  getBoardMemberLinkForProfile,
  getCoachLinkForProfile,
} from "@/lib/admin-auth/profileCardLinks.repository";
import { supabase } from "@/lib/supabase";
import {
  createEmptyScopeContext,
  mergeScopeValues,
  uniqueScopeValues,
} from "./scopeContext";

const ROLE_SCOPE_HINTS = {
  superadmin: ["global", "own_profile"],
  vorstand: ["own_board_card", "own_profile", "read_only"],
  "fussball-vorstand": ["own_board_card", "own_profile", "read_only"],
  jugendleiter: ["youth_all", "own_board_card", "own_profile"],
  trainer: ["own_staff_card", "own_profile", "own_content"],
  betreuer: ["own_staff_card", "own_profile", "own_content"],
  redakteur: ["own_profile", "own_content", "read_only"],
  kassierer: ["own_board_card", "own_profile", "read_only"],
  webmaster: ["own_profile", "read_only"],
  gast: ["read_only"],
};

function isOptionalSchemaError(error) {
  const code = error?.code || null;
  if (code === "42P01" || code === "42703") {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function toOptionalEmptyResult(error) {
  if (isOptionalSchemaError(error)) {
    return { data: [], error: null, optionalMissing: true };
  }

  return { data: [], error, optionalMissing: false };
}

function getReadClient(client = null) {
  if (client) return client;
  if (typeof window === "undefined") return supabase;
  return supabase;
}

export function mapTeamAssignmentRows(rows = []) {
  return (rows || [])
    .filter((row) => row?.is_active !== false)
    .map((row) => ({
      id: row.id || null,
      adminProfileId: row.admin_profile_id || null,
      teamId: row.team_id || null,
      assignmentType: row.assignment_type || null,
      isActive: row.is_active !== false,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      createdBy: row.created_by || null,
      updatedBy: row.updated_by || null,
    }));
}

export function resolveRoleScopeTypes({
  roleKeys = [],
  coachId = null,
  boardMemberId = null,
} = {}) {
  const resolved = [];

  for (const roleKey of uniqueScopeValues(roleKeys)) {
    resolved.push(...(ROLE_SCOPE_HINTS[roleKey] || []));
  }

  if (coachId) {
    resolved.push("own_staff_card");
  }

  if (boardMemberId) {
    resolved.push("own_board_card");
  }

  return uniqueScopeValues(resolved);
}

export async function loadAdminProfileTeamAssignments(client, adminProfileId) {
  if (!client || !adminProfileId) {
    return { data: [], error: null };
  }

  const { data, error } = await client
    .from("admin_profile_team_assignments")
    .select("*")
    .eq("admin_profile_id", adminProfileId)
    .eq("is_active", true);

  if (error) {
    return toOptionalEmptyResult(error);
  }

  return {
    data: mapTeamAssignmentRows(data),
    error: null,
  };
}

export async function loadCoachTeamSeasonAssignments(coachId, client = null) {
  if (!coachId) {
    return { data: [], error: null };
  }

  const supabaseClient = getReadClient(client);
  const { data, error } = await supabaseClient
    .from("coach_team_seasons")
    .select("team_season_id, is_active")
    .eq("coach_id", coachId)
    .eq("is_active", true);

  if (error) {
    return toOptionalEmptyResult(error);
  }

  return {
    data: (data || []).filter((row) => row?.team_season_id),
    error: null,
  };
}

export async function loadTeamIdsForTeamSeasonIds(
  teamSeasonIds = [],
  client = null,
) {
  const ids = uniqueScopeValues(teamSeasonIds);
  if (!ids.length) {
    return { data: [], error: null };
  }

  const supabaseClient = getReadClient(client);
  const { data, error } = await supabaseClient
    .from("team_seasons")
    .select("id, team_id")
    .in("id", ids);

  if (error) {
    return toOptionalEmptyResult(error);
  }

  return {
    data: uniqueScopeValues((data || []).map((row) => row.team_id)),
    error: null,
  };
}

export async function loadAdminProfileManualTeamAssignments(
  adminProfileId,
  client = null,
) {
  const supabaseClient = getReadClient(client);
  return await loadAdminProfileTeamAssignments(supabaseClient, adminProfileId);
}

export function buildScopeContext({
  adminProfileId = null,
  userId = null,
  roleKeys = [],
  permissionKeys = [],
  roleScopeTypes = [],
  regularAssignedTeamIds = [],
  manualAssignedTeamIds = [],
  teamAssignmentRows = [],
  coachId = null,
  boardMemberId = null,
} = {}) {
  const normalizedRoleKeys = uniqueScopeValues(roleKeys);
  const normalizedPermissionKeys = uniqueScopeValues(permissionKeys);
  const fallbackRegularTeamIds = (teamAssignmentRows || [])
    .map((row) => row?.teamId || row?.team_id || null)
    .filter(Boolean);
  const normalizedRegularAssignedTeamIds = uniqueScopeValues(
    regularAssignedTeamIds.length
      ? regularAssignedTeamIds
      : fallbackRegularTeamIds,
  );
  const normalizedManualAssignedTeamIds = uniqueScopeValues(
    manualAssignedTeamIds,
  );
  const assignedTeamIds = mergeScopeValues(
    normalizedRegularAssignedTeamIds,
    normalizedManualAssignedTeamIds,
  );
  const normalizedRoleScopeTypes = uniqueScopeValues([
    ...(adminProfileId ? ["own_profile"] : []),
    ...roleScopeTypes,
  ]);
  const isGlobal =
    normalizedRoleKeys.includes("superadmin") ||
    normalizedRoleScopeTypes.includes("global");
  const canAccessYouthAll = normalizedRoleScopeTypes.includes("youth_all");

  return createEmptyScopeContext({
    adminProfileId,
    userId,
    roleKeys: normalizedRoleKeys,
    permissionKeys: normalizedPermissionKeys,
    roleScopeTypes: normalizedRoleScopeTypes,
    regularAssignedTeamIds: normalizedRegularAssignedTeamIds,
    manualAssignedTeamIds: normalizedManualAssignedTeamIds,
    assignedTeamIds,
    coachId,
    boardMemberId,
    isGlobal,
    canAccessYouthAll,
  });
}

export async function loadAdminProfileScopeContext({
  adminProfileId = null,
  userId = null,
  roleKeys = [],
  permissionKeys = [],
  supabase: client = null,
} = {}) {
  const supabaseClient = getReadClient(client);

  const [boardLinkResult, coachLinkResult] = await Promise.all([
    getBoardMemberLinkForProfile(adminProfileId, supabaseClient),
    getCoachLinkForProfile(adminProfileId, supabaseClient),
  ]);

  const boardMemberId = boardLinkResult?.data?.id || null;
  const coachId = coachLinkResult?.data?.id || null;

  const regularAssignmentResult = coachId
    ? await loadCoachTeamSeasonAssignments(coachId, supabaseClient)
    : { data: [], error: null };

  const regularTeamIdsResult = regularAssignmentResult.error
    ? { data: [], error: regularAssignmentResult.error }
    : await loadTeamIdsForTeamSeasonIds(
        (regularAssignmentResult.data || []).map((row) => row.team_season_id),
        supabaseClient,
      );

  const manualAssignmentResult = await loadAdminProfileManualTeamAssignments(
    adminProfileId,
    supabaseClient,
  );

  const regularAssignedTeamIds = regularTeamIdsResult.data || [];
  const manualAssignedTeamIds = uniqueScopeValues(
    (manualAssignmentResult.data || []).map((row) => row.teamId),
  );

  return {
    context: buildScopeContext({
      adminProfileId,
      userId,
      roleKeys,
      permissionKeys,
      roleScopeTypes: resolveRoleScopeTypes({
        roleKeys,
        coachId,
        boardMemberId,
      }),
      regularAssignedTeamIds,
      manualAssignedTeamIds,
      coachId,
      boardMemberId,
    }),
    sources: {
      boardLinkError: boardLinkResult?.error || null,
      coachLinkError: coachLinkResult?.error || null,
      regularAssignmentError: regularAssignmentResult.error || null,
      regularTeamIdsError: regularTeamIdsResult.error || null,
      manualAssignmentError: manualAssignmentResult.error || null,
    },
  };
}

export async function getAssignedTeamIds(adminProfileId, { supabase } = {}) {
  const { data, error } = await loadAdminProfileTeamAssignments(
    supabase,
    adminProfileId,
  );

  if (error) {
    return { data: [], error };
  }

  return {
    data: Array.from(
      new Set((data || []).map((row) => row.teamId).filter(Boolean)),
    ),
    error: null,
  };
}

export async function getBoardMemberOwnerProfileId(boardMemberId, supabase) {
  if (!boardMemberId || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("board_members")
    .select("id, admin_profile_id")
    .eq("id", boardMemberId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data?.id || !data?.admin_profile_id) {
    return { data: null, error: null };
  }

  return { data: data.admin_profile_id, error: null };
}

export async function getCoachOwnerProfileId(coachId, supabase) {
  if (!coachId || !supabase) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("coaches")
    .select("id, admin_profile_id")
    .eq("id", coachId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data?.id || !data?.admin_profile_id) {
    return { data: null, error: null };
  }

  return { data: data.admin_profile_id, error: null };
}
