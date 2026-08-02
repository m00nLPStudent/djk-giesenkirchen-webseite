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

export const dynamic = "force-dynamic";

export default async function EditPlayerPage({ params }) {
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
    .select("id, first_name, last_name, image_url, photo_url, is_active, description_de, description_en, birthdate, joined_at, year_group, strong_foot, nationality, gender")
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

  if (!canEditPlayerOnServer(scopeContext, playerTeamIds, teamById)) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  const playerSeasonalReadModel = await getPlayerSeasonalReadModel(
    supabaseServer,
    id,
  );
  const teamOptionsResult = await loadScopedPlayerTeamSeasonOptions(
    scopeContext,
    supabaseServer,
  );

  return (
    <AdminLayout title="Spieler bearbeiten" subtitle="Spieler" showHeader={false}>
      <AdminModulePage>
        <AdminBackLink href={`/admin/players/${id}`}>Zurück zu Spielerdetails</AdminBackLink>
        <AdminModuleHeader eyebrow="Spieler" title="Spieler bearbeiten" description="Spielerprofil und Mannschaftszuordnung bearbeiten." />
        <AdminPlayersForm
          player={player}
          teamOptionsResult={teamOptionsResult}
          playerSeasonalReadModel={playerSeasonalReadModel}
        />
      </AdminModulePage>
    </AdminLayout>
  );
}
