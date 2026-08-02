import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import PlayerContributionDetailView from "@/components/admin/players/components/PlayerContributionDetailView";
import {
  canEditPlayerOnServer,
  canDeletePlayerOnServer,
  canViewPlayerOnServer,
  getPlayerTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import { getPlayerSeasonalReadModel } from "@/components/admin/persons/playerSeasonalReadModelRepository";
import { FormAlert } from "@/components/admin/forms";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import {
  getContributionStatusVisibility,
} from "@/components/admin/contributions/helpers/contributionStatusScope";
import {
  createPlayerContributionStatusDto,
  getContributionSeasonWarning,
} from "@/components/admin/contributions/helpers/contributionStatusSummary";
import { loadContributionStatusRowsByPlayerIds } from "@/components/admin/contributions/repositories/contributionStatus.repository";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";

export const dynamic = "force-dynamic";

export default async function AdminPlayerDetailPage({ params }) {
  const { id } = await params;
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: player } = await supabaseServer
    .from("players")
    .select(
      "id, first_name, last_name, image_url, photo_url, is_active, description_de, description_en, birthdate, joined_at, year_group, strong_foot, nationality, gender, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!player) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(supabaseServer, [id]);
  const playerTeamIds = teamIdsByPlayerId.get(id) || [];

  if (!canViewPlayerOnServer(scopeContext, playerTeamIds, teamById)) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  const playerSeasonalReadModel = await getPlayerSeasonalReadModel(supabaseServer, id);
  const playerDto = createPlayerReadDto(player, playerSeasonalReadModel);

  const contributionVisibility = getContributionStatusVisibility(scopeContext);
  const contributionAdminClient =
    contributionVisibility !== "none" ? createSupabaseAdminClient() : null;
  const contributionSeasonResolution = contributionAdminClient
    ? await loadCurrentSeasonResolution(contributionAdminClient)
    : null;
  const contributionSeasonWarning = getContributionSeasonWarning(
    contributionSeasonResolution,
  );
  const contributionRows =
    contributionAdminClient && contributionSeasonResolution?.activeSeasonId
      ? await loadContributionStatusRowsByPlayerIds(
          contributionAdminClient,
          [id],
          contributionSeasonResolution.activeSeasonId,
        )
      : [];
  const contributionStatus =
    contributionVisibility !== "none" &&
    contributionSeasonResolution?.activeSeasonId &&
    !contributionSeasonWarning
      ? createPlayerContributionStatusDto(
          id,
          contributionSeasonResolution.activeSeasonId,
          contributionRows,
        )
      : null;
  const canEdit = permissionResult.permissions.includes("players.edit")
    ? canEditPlayerOnServer(scopeContext, playerTeamIds, teamById)
    : false;
  const canArchive = permissionResult.permissions.includes("players.delete")
    ? canDeletePlayerOnServer(scopeContext, playerTeamIds, teamById)
    : false;

  return (
    <AdminLayout title="Spielerdetails" subtitle="Spieler" showHeader={false}>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        {contributionVisibility === "none" ? (
          <FormAlert className="border-white/10 bg-white/[0.04] text-white/75" tone="warning">
            Fuer deine Rolle werden in dieser Ansicht keine Beitragsdaten angezeigt.
          </FormAlert>
        ) : null}

        <PlayerContributionDetailView
          player={playerDto}
          canEdit={canEdit}
          canArchive={canArchive}
          contributionStatus={contributionStatus}
          contributionVisibility={contributionVisibility}
          contributionSeasonWarning={contributionSeasonWarning}
        />
      </div>
    </AdminLayout>
  );
}
