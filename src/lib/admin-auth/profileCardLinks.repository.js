import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { createCoachCardRows } from "./profileCardLinks.coachCore.mjs";
import { createCardRow, normalizeEmailForCardMatching } from "./profileCardLinks.core.mjs";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

function normalizeCardRow(row = {}, type) {
  return createCardRow(row, type);
}

async function loadCurrentSeasonRows(client) {
  const { data, error } = await client
    .from("seasons")
    .select("id, name, slug, is_current")
    .eq("is_current", true);

  if (error) throw error;
  return data || [];
}

async function normalizeCoachCardRows(rows = [], client = supabase) {
  const coachIds = Array.from(
    new Set((rows || []).map((row) => row?.id).filter(Boolean)),
  );
  if (!coachIds.length) {
    return { data: [], error: null };
  }

  try {
    const currentSeasonRows = await loadCurrentSeasonRows(client);
    const { data: assignments, error: assignmentError } = await client
      .from("coach_team_seasons")
      .select(
        "id, coach_id, team_season_id, role_de, role_en, is_active, sort_order, created_at",
      )
      .in("coach_id", coachIds)
      .eq("is_active", true);

    if (assignmentError) throw assignmentError;

    const teamSeasonIds = Array.from(
      new Set((assignments || []).map((row) => row?.team_season_id).filter(Boolean)),
    );
    const { data: teamSeasonRows, error: teamSeasonError } = teamSeasonIds.length
      ? await client
          .from("team_seasons")
          .select("id, team_id, season_id, name_de, name_en, slug, is_active")
          .in("id", teamSeasonIds)
      : { data: [], error: null };

    if (teamSeasonError) throw teamSeasonError;

    return {
      data: createCoachCardRows(rows, {
        currentSeasonRows,
        assignmentRows: assignments || [],
        teamSeasonRows: teamSeasonRows || [],
      }),
      error: null,
    };
  } catch (error) {
    return { data: [], error };
  }
}

export async function fetchBoardMemberById(id, client = supabase) {
  return await client
    .from("board_members")
    .select(
      "id, first_name, last_name, role_de, email, admin_profile_id, is_active",
    )
    .eq("id", id)
    .maybeSingle();
}

export async function fetchCoachById(id, client = supabase) {
  return await client
    .from("coaches")
    .select("id, first_name, last_name, name, email, admin_profile_id, is_active")
    .eq("id", id)
    .maybeSingle();
}

export async function getBoardMemberLinkForProfile(
  adminProfileId,
  client = supabase,
) {
  if (!adminProfileId) {
    return { data: null, error: null };
  }

  const result = await client
    .from("board_members")
    .select(
      "id, first_name, last_name, role_de, email, admin_profile_id, is_active",
    )
    .eq("admin_profile_id", adminProfileId)
    .maybeSingle();

  return {
    data: result.data ? normalizeCardRow(result.data, "board") : null,
    error: result.error,
  };
}

export async function getCoachLinkForProfile(
  adminProfileId,
  client = supabase,
) {
  if (!adminProfileId) {
    return { data: null, error: null };
  }

  const result = await client
    .from("coaches")
    .select(
      "id, first_name, last_name, name, role, role_de, role_en, email, admin_profile_id, is_active",
    )
    .eq("admin_profile_id", adminProfileId)
    .maybeSingle();

  const normalizedResult =
    result.data && !result.error
      ? await normalizeCoachCardRows([result.data], client)
      : { data: [null], error: null };

  return {
    data: normalizedResult.data[0] || null,
    error: result.error || normalizedResult.error,
  };
}

export async function linkBoardMemberToProfile(
  boardMemberId,
  adminProfileId,
  client = supabase,
) {
  return await client
    .from("board_members")
    .update({ admin_profile_id: adminProfileId || null })
    .eq("id", boardMemberId)
    .select(
      "id, first_name, last_name, role_de, email, admin_profile_id, is_active",
    )
    .maybeSingle();
}

export async function unlinkBoardMemberFromProfile(
  adminProfileId,
  client = supabase,
) {
  const { data, error } = await client
    .from("board_members")
    .update({ admin_profile_id: null })
    .eq("admin_profile_id", adminProfileId)
    .select("id, admin_profile_id");

  if (error) {
    const err = new Error("board_members unlink failed");
    err.code = error.code || null;
    err.details = error.message || "";
    throw err;
  }

  return {
    ok: true,
    rowsUpdated: Array.isArray(data) ? data.length : 0,
    rows: data || [],
  };
}

export async function linkCoachToProfile(
  coachId,
  adminProfileId,
  client = supabase,
) {
  return await client
    .from("coaches")
    .update({ admin_profile_id: adminProfileId || null })
    .eq("id", coachId)
    .select("id, first_name, last_name, name, email, admin_profile_id, is_active")
    .maybeSingle();
}

export async function unlinkCoachFromProfile(
  adminProfileId,
  client = supabase,
) {
  const { data, error } = await client
    .from("coaches")
    .update({ admin_profile_id: null })
    .eq("admin_profile_id", adminProfileId)
    .select("id, admin_profile_id");

  if (error) {
    const err = new Error("coaches unlink failed");
    err.code = error.code || null;
    err.details = error.message || "";
    throw err;
  }

  return {
    ok: true,
    rowsUpdated: Array.isArray(data) ? data.length : 0,
    rows: data || [],
  };
}

export async function listUnlinkedBoardMembers(client = getReadClient()) {
  const { data, error } = await client
    .from("board_members")
    .select(
      "id, first_name, last_name, role_de, email, admin_profile_id, is_active",
    )
    .is("admin_profile_id", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    data: (data || []).map((row) => normalizeCardRow(row, "board")),
    error,
  };
}

export async function listUnlinkedCoaches(client = getReadClient()) {
  const { data, error } = await client
    .from("coaches")
    .select(
      "id, first_name, last_name, name, role, role_de, role_en, email, admin_profile_id, is_active",
    )
    .is("admin_profile_id", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const normalizedResult = !error
    ? await normalizeCoachCardRows(data || [], client)
    : { data: [], error: null };

  return {
    data: normalizedResult.data,
    error: error || normalizedResult.error,
  };
}

export async function listBoardMembersForLinking(client = getReadClient()) {
  const { data, error } = await client
    .from("board_members")
    .select(
      "id, first_name, last_name, role_de, email, admin_profile_id, is_active",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    data: (data || []).map((row) => normalizeCardRow(row, "board")),
    error,
  };
}

export async function listCoachesForLinking(client = getReadClient()) {
  const { data, error } = await client
    .from("coaches")
    .select(
      "id, first_name, last_name, name, role, role_de, role_en, email, admin_profile_id, is_active",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const normalizedResult = !error
    ? await normalizeCoachCardRows(data || [], client)
    : { data: [], error: null };

  return {
    data: normalizedResult.data,
    error: error || normalizedResult.error,
  };
}

export { normalizeEmailForCardMatching };
