import Link from "next/link";
import { redirect } from "next/navigation";
import Can from "@/components/admin/auth/Can";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import { AdminPlayersList, PlayerStats } from "@/components/admin/players";
import { sortPlayersByIdentity } from "@/components/admin/players/list/playerList.helpers";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { getPlayerSeasonalReadModelsMap } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import PlayerNationalityList from "@/components/admin/players/stats/PlayerNationalityList";
import { getPlayerStats } from "@/components/admin/players/stats/playerStats.helpers";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canDeletePlayerOnServer,
  canEditPlayerOnServer,
  canViewPlayerOnServer,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

function buildPlayerScopeMaps(readModels = new Map()) {
  const teamIdsByPlayerId = new Map();
  const teamById = new Map();

  readModels.forEach((readModel, playerId) => {
    const teamIds = [];

    (readModel?.assignments || []).forEach((assignment) => {
      if (!assignment?.teamId) return;

      if (!teamById.has(assignment.teamId)) {
        teamById.set(assignment.teamId, {
          id: assignment.teamId,
          name_de: assignment.teamNameDe || assignment.teamNameEn || "Keine Mannschaft",
          slug: assignment.teamSlug || null,
          age_group: assignment.ageGroup || null,
          is_active: assignment.isActive !== false,
        });
      }

      if (!teamIds.includes(assignment.teamId)) {
        teamIds.push(assignment.teamId);
      }
    });

    teamIdsByPlayerId.set(playerId, teamIds);
  });

  return { teamIdsByPlayerId, teamById };
}

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
      "id, first_name, last_name, photo_url, image_url, is_active, year_group, strong_foot, description_de, description_en, nationality, gender, birthdate, joined_at, created_at",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .order("id", { ascending: true });

  const playerListRaw = players || [];
  const playerIds = playerListRaw.map((player) => player.id).filter(Boolean);
  const playerReadModels = await getPlayerSeasonalReadModelsMap(
    supabaseServer,
    playerIds,
  );
  const { teamIdsByPlayerId, teamById } = buildPlayerScopeMaps(playerReadModels);

  const playerList = sortPlayersByIdentity(
    playerListRaw
      .filter((player) => {
      const playerTeamIds = teamIdsByPlayerId.get(player.id) || [];
      return canViewPlayerOnServer(scopeContext, playerTeamIds, teamById);
      })
      .map((player) => {
        const playerTeamIds = teamIdsByPlayerId.get(player.id) || [];
        const dto = createPlayerReadDto(
          player,
          playerReadModels.get(player.id) || {},
        );

        return {
          ...dto,
          first_name: dto.firstName,
          last_name: dto.lastName,
          image_url: dto.imageUrl,
          is_active: dto.isActive,
          shirt_number: dto.shirtNumber,
          position_de: dto.positionDe,
          position_en: dto.positionEn,
          is_captain: dto.isCaptain,
          year_group: dto.yearGroup,
          strong_foot: dto.strongFoot,
          description_de: dto.descriptionDe,
          description_en: dto.descriptionEn,
          birthdate: dto.birthdate,
          joined_at: dto.joinedAt,
          created_at: dto.createdAt,
          nationality: dto.nationality,
          gender: dto.gender,
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
      }),
  );

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
