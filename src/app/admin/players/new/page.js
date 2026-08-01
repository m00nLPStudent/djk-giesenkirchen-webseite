import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { CURRENT_SEASON_STATUSES } from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { loadScopedPlayerTeamSeasonOptions } from "@/components/admin/players/services/playerTeamSeasonOptions.repository";

export const dynamic = "force-dynamic";

export default async function NewPlayerPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const teamOptionsResult = await loadScopedPlayerTeamSeasonOptions(
    scopeContext,
    permissionResult.supabaseServer,
  );

  if (
    teamOptionsResult.activeSeasonStatus ===
      CURRENT_SEASON_STATUSES.RESOLVED &&
    teamOptionsResult.teamOptions.length === 0
  ) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  return (
    <AdminLayout title="Neuer Spieler" subtitle="Spieler">
      <BackButton />
      <AdminPlayersForm teamOptionsResult={teamOptionsResult} />
    </AdminLayout>
  );
}
