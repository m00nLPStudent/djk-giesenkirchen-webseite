import Link from "next/link";
import { redirect } from "next/navigation";
import Can from "@/components/admin/auth/Can";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { AdminPlayersList, PlayerStats } from "@/components/admin/players";
import PlayerNationalityList from "@/components/admin/players/stats/PlayerNationalityList";
import { getPlayerStats } from "@/components/admin/players/stats/playerStats.helpers";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canDeletePlayerOnServer,
  canEditPlayerOnServer,
  canViewPlayerOnServer,
  getPlayerTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage({ searchParams }) {
  const params = await searchParams;

  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: players } = await supabaseServer
    .from("players")
    .select(
      "id, first_name, last_name, shirt_number, position_de, photo_url, image_url, is_active, is_captain, year_group, strong_foot, description_de, nationality, gender, team_id, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("last_name", { ascending: true });

  const playerListRaw = players || [];
  const playerIds = playerListRaw.map((player) => player.id).filter(Boolean);
  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(
    supabaseServer,
    playerIds,
  );

  const playerList = playerListRaw
    .filter((player) => {
      const playerTeamIds = teamIdsByPlayerId.get(player.id) || [];
      return canViewPlayerOnServer(scopeContext, playerTeamIds, teamById);
    })
    .map((player) => {
      const playerTeamIds = teamIdsByPlayerId.get(player.id) || [];
      const primaryTeam = teamById.get(playerTeamIds[0]) || null;

      return {
        ...player,
        teams: primaryTeam
          ? {
              id: primaryTeam.id,
              name_de: primaryTeam.name_de,
              slug: primaryTeam.slug,
            }
          : null,
        _canEditInScope: canEditPlayerOnServer(
          scopeContext,
          playerTeamIds,
          teamById,
        ),
        _canDeleteInScope: canDeletePlayerOnServer(
          scopeContext,
          playerTeamIds,
          teamById,
        ),
      };
    });

  const stats = getPlayerStats(playerList);

  const initialFilters = {
    statusFilter: params?.status || "all",
    nationalityFilter: params?.nationality || "all",
  };

  const showNationalities = params?.view === "nationalities";

  return (
    <AdminLayout
      title="Spieler verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Spieler"
        title="Spieler verwalten"
        description="Spielerprofile, Positionen und Nationalitäten mit schnellen Filtern organisieren."
        actions={
          <Can permission="players.create" uiOnly>
            <Link
              href="/admin/players/new"
              className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
            >
              Neuer Spieler
            </Link>
          </Can>
        }
      />

      <PlayerStats
        total={stats.total}
        inactive={stats.inactive}
        nationalityCount={stats.nationalityCount}
        openContributions={stats.openContributions}
      />

      {showNationalities && (
        <PlayerNationalityList nationalities={stats.nationalities} />
      )}

      <AdminPlayersList players={playerList} initialFilters={initialFilters} />
    </AdminLayout>
  );
}
