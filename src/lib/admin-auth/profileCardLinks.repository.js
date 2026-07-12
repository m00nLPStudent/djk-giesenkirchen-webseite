import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function buildBoardLabel(row = {}) {
  const name = [row.first_name, row.last_name]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const role = normalizeText(row.role_de);
  return [name || "Vorstand", role].filter(Boolean).join(" - ");
}

function buildCoachLabel(row = {}) {
  const name =
    normalizeText(row.name) ||
    [row.first_name, row.last_name]
      .map(normalizeText)
      .filter(Boolean)
      .join(" ");
  const role = normalizeText(row.role_de) || normalizeText(row.role);
  return [name || "Trainer", role].filter(Boolean).join(" - ");
}

function normalizeCardRow(row = {}, type) {
  return {
    id: row.id || null,
    type,
    email: row.email || null,
    admin_profile_id: row.admin_profile_id || null,
    is_active: row.is_active !== false,
    label: type === "board" ? buildBoardLabel(row) : buildCoachLabel(row),
  };
}

export function normalizeEmailForCardMatching(value = "") {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
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
    .select(
      "id, first_name, last_name, name, role, role_de, email, admin_profile_id, is_active",
    )
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
      "id, first_name, last_name, name, role, role_de, email, admin_profile_id, is_active",
    )
    .eq("admin_profile_id", adminProfileId)
    .maybeSingle();

  return {
    data: result.data ? normalizeCardRow(result.data, "coach") : null,
    error: result.error,
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
    .select(
      "id, first_name, last_name, name, role, role_de, email, admin_profile_id, is_active",
    )
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
      "id, first_name, last_name, name, role, role_de, email, admin_profile_id, is_active",
    )
    .is("admin_profile_id", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    data: (data || []).map((row) => normalizeCardRow(row, "coach")),
    error,
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
      "id, first_name, last_name, name, role, role_de, email, admin_profile_id, is_active",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    data: (data || []).map((row) => normalizeCardRow(row, "coach")),
    error,
  };
}
