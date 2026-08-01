import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminPlayersForm } from "@/components/admin/players";
import BackButton from "@/components/admin/ui/BackButton";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreatePlayerOnServer,
  loadScopedActiveTeamsForPeople,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function NewPlayerPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.create",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-player-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const teams = await loadScopedActiveTeamsForPeople(
    scopeContext,
    permissionResult.supabaseServer,
  );

  if (
    !canCreatePlayerOnServer(
      scopeContext,
      teams.map((team) => team.id),
      new Map(teams.map((team) => [team.id, team])),
    )
  ) {
    redirect("/admin/unauthorized?reason=missing-player-scope");
  }

  return (
    <AdminLayout title="Neuer Spieler" subtitle="Spieler">
      <BackButton />
      <AdminPlayersForm teams={teams || []} />
    </AdminLayout>
  );
}
