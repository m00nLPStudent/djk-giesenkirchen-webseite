import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { MEMBERSHIP_TEAM_RESOLUTION } from "@/lib/membership/membershipTeamResolver.core.mjs";
import { resolveMembershipFootballTeams } from "@/lib/membership/membershipTeamResolver.service";

const RESPONSE_HEADERS = { "Cache-Control": "no-store, private", "Content-Type": "application/json; charset=utf-8" };

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1024) return Response.json({ status: MEMBERSHIP_TEAM_RESOLUTION.INVALID_BIRTHDATE, options: [] }, { status: 400, headers: RESPONSE_HEADERS });
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ status: MEMBERSHIP_TEAM_RESOLUTION.INVALID_BIRTHDATE, options: [] }, { status: 400, headers: RESPONSE_HEADERS }); }
  const birthdate = typeof payload?.birthdate === "string" ? payload.birthdate : "";
  const client = createSupabaseAdminClient();
  const result = await resolveMembershipFootballTeams(birthdate, { client });
  const httpStatus = result.status === MEMBERSHIP_TEAM_RESOLUTION.INVALID_BIRTHDATE ? 400 : result.status === MEMBERSHIP_TEAM_RESOLUTION.UNAVAILABLE ? 503 : 200;
  return Response.json(result, { status: httpStatus, headers: RESPONSE_HEADERS });
}
