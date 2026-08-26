import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import SeasonTeamYearsModule from "@/components/admin/settings/season-team-years/SeasonTeamYearsModule";
import { loadSeasonTeamYearsAdminData } from "@/components/admin/settings/season-team-years/seasonTeamYears.repository";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadServerTeamScopeContext, filterScopedTeamsOnServer } from "@/components/admin/teams/serverTeamScope";

export const dynamic = "force-dynamic";
export default async function SeasonTeamYearsPage() {
  const auth = await assertAdminActionPermission({ requiredPermission: "teams.edit" });
  if (!auth.ok) redirect("/admin/unauthorized?reason=missing-teams-edit-permission");
  const scope = await loadServerTeamScopeContext(auth);
  const adminDb = createSupabaseAdminClient();
  const result = adminDb ? await loadSeasonTeamYearsAdminData(adminDb) : { data: null, error: { message: "Serverseitiger Datenbankzugriff ist nicht konfiguriert." } };
  if (result.error) console.error("[season-team-years] load failed", { message: result.error.message, code: result.error.code || null });
  const source = result.data || { seasons: [], teams: [], teamSeasons: [], mappings: [] };
  const allowedTeams = filterScopedTeamsOnServer(scope, source.teams);
  const allowedIds = new Set(allowedTeams.map((team) => team.id));
  const teamNames = new Map(allowedTeams.map((team) => [team.id, team.name_de]));
  const teamSeasons = source.teamSeasons.filter((row) => allowedIds.has(row.team_id)).map((row) => ({ ...row, team_name_de: teamNames.get(row.team_id) || null }));
  const teamSeasonIds = new Set(teamSeasons.map((row) => row.id));
  const data = { seasons: source.seasons, teamSeasons, mappings: source.mappings.filter((row) => teamSeasonIds.has(row.team_season_id)) };
  return <AdminLayout title="Saisons & Mannschaften" subtitle="Einstellungen" showHeader={false}><SeasonTeamYearsModule initialData={JSON.parse(JSON.stringify(data))} unavailable={Boolean(result.error)}/></AdminLayout>;
}
