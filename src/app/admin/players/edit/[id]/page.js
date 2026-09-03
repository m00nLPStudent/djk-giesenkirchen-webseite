import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import { AdminBackLink, AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canEditPlayerOnServer,
  getPlayerTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { getPlayerSeasonalReadModel } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import { loadScopedPlayerTeamSeasonOptions } from "@/components/admin/players/services/playerTeamSeasonOptions.repository";
import { loadMediaAssetForPicker } from "@/components/admin/media-library/media.service";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({ params, requiredDepartmentSlug = null }) {
  const { id } = await params;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.edit",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: player } = await supabaseServer
    .from("players")
    .select("id, first_name, last_name, image_url, photo_url, image_media_asset_id, is_active, description_de, description_en, birthdate, joined_at, year_group, strong_foot, nationality, gender, department_id")
    .eq("id", id)
    .maybeSingle();

  if (!player) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(
    supabaseServer,
    [id],
  );
  const playerTeamIds = teamIdsByPlayerId.get(id) || [];
  const { data: requiredDepartment } = requiredDepartmentSlug
    ? await supabaseServer.from("departments").select("id").eq("slug", requiredDepartmentSlug).eq("is_active", true).maybeSingle()
    : { data: null };
  if (requiredDepartmentSlug && player.department_id !== requiredDepartment?.id) redirect("/admin/unauthorized?reason=missing-player-scope");
  const basePath = requiredDepartmentSlug ? `/admin/${requiredDepartmentSlug === "fussball" ? "football" : "table-tennis"}/players` : "/admin/players";

  if (!canEditPlayerOnServer(scopeContext, playerTeamIds, teamById, player)) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  const playerSeasonalReadModel = await getPlayerSeasonalReadModel(
    supabaseServer,
    id,
  );
  const teamOptionsResult = await loadScopedPlayerTeamSeasonOptions(
    scopeContext,
    supabaseServer,
    { requiredDepartmentId: requiredDepartment?.id || null },
  );
  const mediaResult = await loadMediaAssetForPicker(player.image_media_asset_id);

  return (
    <AdminLayout title="Spieler bearbeiten" subtitle="Spieler" showHeader={false}>
      <AdminModulePage>
        <AdminBackLink href={`${basePath}/${id}`}>Zurück zu Spielerdetails</AdminBackLink>
        <AdminModuleHeader eyebrow="Spieler" title="Spieler bearbeiten" description="Spielerprofil und Mannschaftszuordnung bearbeiten." />
        <AdminPlayersForm
          player={{ ...player, mediaAsset: mediaResult.data || null }}
          teamOptionsResult={teamOptionsResult}
          playerSeasonalReadModel={playerSeasonalReadModel}
          sportContext={requiredDepartmentSlug === "tischtennis" ? "table_tennis" : requiredDepartmentSlug === "fussball" ? "football" : "global"}
          returnPath={basePath}
        />
      </AdminModulePage>
    </AdminLayout>
  );
}
