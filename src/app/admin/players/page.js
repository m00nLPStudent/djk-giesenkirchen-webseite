import { redirect } from "next/navigation";
import { FormAlert } from "@/components/admin/forms";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPlayersOverview from "@/components/admin/players/AdminPlayersOverview";
import {
  getContributionStatusVisibility,
} from "@/components/admin/contributions/helpers/contributionStatusScope";
import {
  buildPlayerContributionStatusMap,
  getContributionSeasonWarning,
} from "@/components/admin/contributions/helpers/contributionStatusSummary";
import { loadContributionStatusRowsByPlayerIds } from "@/components/admin/contributions/repositories/contributionStatus.repository";
import {
  filterPlayers,
  sortPlayersByIdentity,
} from "@/components/admin/players/list/playerList.helpers";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { getPlayerSeasonalReadModelsMap } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import PlayerNationalityList from "@/components/admin/players/stats/PlayerNationalityList";
import { getPlayerStats } from "@/components/admin/players/stats/playerStats.helpers";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
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

  const contributionVisibility = getContributionStatusVisibility(scopeContext);
  const canShowContributionStatus = contributionVisibility !== "none";
  const contributionAdminClient = canShowContributionStatus
    ? createSupabaseAdminClient()
    : null;
  const currentSeasonResolution = canShowContributionStatus && contributionAdminClient
    ? await loadCurrentSeasonResolution(contributionAdminClient)
    : null;
  const contributionSeasonWarning = getContributionSeasonWarning(
    currentSeasonResolution,
  );
  const contributionRows =
    canShowContributionStatus &&
    contributionAdminClient &&
    currentSeasonResolution?.activeSeasonId
      ? await loadContributionStatusRowsByPlayerIds(
          contributionAdminClient,
          playerList.map((player) => player.id),
          currentSeasonResolution.activeSeasonId,
        )
      : [];
  const contributionStatusByPlayerId =
    canShowContributionStatus && currentSeasonResolution?.activeSeasonId
      ? buildPlayerContributionStatusMap(
          playerList.map((player) => player.id),
          currentSeasonResolution.activeSeasonId,
          contributionRows,
        )
      : new Map();
  const playerListWithContributionStatus = playerList.map((player) => ({
    ...player,
    contributionStatus: contributionStatusByPlayerId.get(player.id) || null,
  }));

  const stats = getPlayerStats(playerListWithContributionStatus);
  const canFilterByContribution =
    canShowContributionStatus && !contributionSeasonWarning;

  const initialFilters = {
    sortBy: params?.sort || "name_asc",
    statusFilter: params?.status || "active",
    teamFilter: params?.team || "all",
    genderFilter: params?.gender || "all",
    nationalityFilter: params?.nationality || "all",
    positionFilter: params?.position || "all",
    captainFilter: params?.captain || "all",
    contributionFilter: canFilterByContribution
      ? params?.contribution || "all"
      : "all",
  };
  const visiblePlayers = filterPlayers(playerListWithContributionStatus, {
    ...initialFilters,
    search: "",
  });

  const showNationalities = params?.view === "nationalities";

  return (
    <AdminLayout
      title="Spieler verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPlayersOverview
        players={visiblePlayers}
        initialFilters={initialFilters}
        showContributionStatus={canShowContributionStatus && !contributionSeasonWarning}
        canFilterByContribution={canFilterByContribution}
        stats={stats}
        notices={contributionSeasonWarning ? (
        <FormAlert className="mb-6 border-amber-400/30 bg-amber-500/10 text-amber-50" tone="warning">
          {contributionSeasonWarning}
        </FormAlert>
        ) : null}
        nationalityView={showNationalities ? <PlayerNationalityList nationalities={stats.nationalities} /> : null}
      />
    </AdminLayout>
  );
}
