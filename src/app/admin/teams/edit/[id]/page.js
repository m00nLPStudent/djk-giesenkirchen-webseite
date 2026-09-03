import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import TeamScopeGate from "@/components/admin/teams/components/TeamScopeGate";
import {
  canAccessTeamOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { loadTeamEditCoachData } from "@/components/admin/teams/teamEditCoach.repository";
import { loadTeamEditPlayerOptions } from "@/components/admin/teams/teamEditPlayer.repository";
import { AdminBackLink, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { redirect } from "next/navigation";
import { canManageMedia, loadMediaAssetForPicker, loadMediaAssetsForPicker } from "@/components/admin/media-library/media.service";
import { loadActiveTeamDepartments } from "@/components/admin/teams/services/teamDepartments.repository";
import { loadTeamTypes } from "@/components/admin/settings/team-types/teamTypes.repository";

export default async function EditTeamPage({ params, requiredDepartmentSlug = null }) {
  const { id } = await params;

  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.edit",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-team-permission");
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: team } = await supabaseServer
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (!team || !canAccessTeamOnServer(scopeContext, team)) {
    redirect("/admin/unauthorized?reason=missing-team-scope");
  }
  const { data: requiredDepartment } = requiredDepartmentSlug
    ? await supabaseServer.from("departments").select("id").eq("slug", requiredDepartmentSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  if (requiredDepartmentSlug && team.department_id !== requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-team-scope");
  const basePath = requiredDepartmentSlug ? `/admin/${requiredDepartmentSlug === "fussball" ? "football" : "table-tennis"}/teams` : "/admin/teams";

  const { data: seasons } = await supabaseServer
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const { data: departments } = await loadActiveTeamDepartments(supabaseServer);
  const { data: teamTemplates } = await loadTeamTypes(supabaseServer, { activeOnly: true, departmentId: team.department_id });
  const scopedDepartments = scopeContext.managedDepartmentId
    ? (departments || []).filter((department) => department.id === scopeContext.managedDepartmentId)
    : (departments || []);

  const coachEditData = await loadTeamEditCoachData(supabaseServer, id, team.department_id);
  const teamSeasons = coachEditData.teamSeasons;

  const ids = (teamSeasons || []).map((item) => item.id);

  const { data: playerAssignments } = ids.length
    ? await supabaseServer
        .from("player_team_seasons")
        .select("*")
        .in("team_season_id", ids)
    : { data: [] };

  const players = await loadTeamEditPlayerOptions(supabaseServer, id, team.department_id);
  const teamMedia = await loadMediaAssetForPicker(team.team_image_media_asset_id);
  const teamContactMedia = await loadMediaAssetForPicker(team.contact_image_media_asset_id);
  const seasonMedia = await loadMediaAssetsForPicker((teamSeasons || []).flatMap((item) => [item.team_image_media_asset_id, item.contact_image_media_asset_id]));
  const allowedContactVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
  const initialTeamContactMedia = allowedContactVisibilities.includes(teamContactMedia.data?.visibility) ? teamContactMedia.data : null;
  const initialSeasonMediaByTeamSeasonId = Object.fromEntries((teamSeasons || []).map((item) => [item.id, seasonMedia.data.get(item.team_image_media_asset_id) || null]));
  const initialSeasonContactMediaByTeamSeasonId = Object.fromEntries((teamSeasons || []).map((item) => {
    const media = seasonMedia.data.get(item.contact_image_media_asset_id) || null;
    return [item.id, allowedContactVisibilities.includes(media?.visibility) ? media : null];
  }));

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften" showHeader={false}>
      <AdminModulePage>
      <AdminBackLink href={`${basePath}/${id}`}>Zurück zu Mannschaftsdetails</AdminBackLink>
      <AdminModuleHeader eyebrow="Mannschaften" title="Mannschaft bearbeiten" description="Mannschaft und Saisonzuordnungen bearbeiten." />
      <TeamScopeGate team={team}>
        <AdminTeamsForm
          team={team}
          seasons={seasons || []}
          departments={scopedDepartments}
          teamTemplates={teamTemplates || []}
          teamSeasons={teamSeasons || []}
          players={players || []}
          coaches={coachEditData.coaches || []}
          playerAssignments={playerAssignments || []}
          coachAssignments={coachEditData.coachAssignments || []}
          currentSeasonCoachAssignments={
            coachEditData.currentSeasonCoachAssignments || []
          }
          currentSeasonResolution={coachEditData.currentSeasonResolution}
          currentTeamSeasons={coachEditData.currentTeamSeasons || []}
          initialTeamMedia={teamMedia.data || null}
          initialTeamContactMedia={initialTeamContactMedia}
          initialSeasonMediaByTeamSeasonId={initialSeasonMediaByTeamSeasonId}
          initialSeasonContactMediaByTeamSeasonId={initialSeasonContactMediaByTeamSeasonId}
          returnPath={basePath}
        />
      </TeamScopeGate>
      </AdminModulePage>
    </AdminLayout>
  );
}
