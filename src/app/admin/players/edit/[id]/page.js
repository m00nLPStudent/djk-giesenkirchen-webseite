import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canEditPlayerOnServer,
  getPlayerTeamIdsMap,
  loadScopedActiveTeamsForPeople,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

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
    .select("*")
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

  const teams = await loadScopedActiveTeamsForPeople(
    scopeContext,
    supabaseServer,
  );

  return (
    <AdminLayout title="Spieler bearbeiten" subtitle="Spieler">
      <BackButton />
      <AdminPlayersForm player={player} teams={teams || []} />
    </AdminLayout>
  );
}
