import AdminLayout from "@/components/admin/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import Can from "@/components/admin/auth/Can";
import { AdminCoachesOverview } from "@/components/admin/coaches";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateCoachOnServer,
  canDeleteCoachOnServer,
  canEditCoachOnServer,
  canViewCoachOnServer,
  getCoachTeamIdsMap,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.view",
  });

  if (!permissionResult.ok) {
    redirect("/admin/unauthorized?reason=missing-coach-permission");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const canCreateCoaches = canCreateCoachOnServer(scopeContext);
  const supabaseServer = permissionResult.supabaseServer;

  const { data: coaches } = await supabaseServer
    .from("coaches")
    .select(
      "id, first_name, last_name, name, slug, role, email, nationality, image_url, is_active, team_id, team_name, admin_profile_id, sort_order",
    )
    .order("sort_order", { ascending: true });

  const coachListRaw = coaches || [];
  const coachIds = coachListRaw.map((coach) => coach.id).filter(Boolean);
  const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
    supabaseServer,
    coachIds,
  );

  const coachList = coachListRaw
    .filter((coach) => {
      const coachTeamIds = teamIdsByCoachId.get(coach.id) || [];
      return canViewCoachOnServer(scopeContext, coach, coachTeamIds, teamById);
    })
    .map((coach) => {
      const coachTeamIds = teamIdsByCoachId.get(coach.id) || [];
      const primaryTeam = teamById.get(coachTeamIds[0]) || null;

      return {
        id: coach.id,
        first_name: coach.first_name,
        last_name: coach.last_name,
        name: coach.name,
        slug: coach.slug,
        role: coach.role,
        email: coach.email,
        nationality: coach.nationality,
        image_url: coach.image_url,
        is_active: coach.is_active,
        team_id: coach.team_id,
        team_name: coach.team_name,
        sort_order: coach.sort_order,
        teams: primaryTeam
          ? {
              id: primaryTeam.id,
              name_de: primaryTeam.name_de,
              slug: primaryTeam.slug,
            }
          : null,
        _canEditInScope: canEditCoachOnServer(
          scopeContext,
          coach,
          coachTeamIds,
          teamById,
        ),
        _canDeleteInScope: canDeleteCoachOnServer(
          scopeContext,
          coach,
          coachTeamIds,
          teamById,
        ),
      };
    });

  return (
    <AdminLayout
      title="Trainer verwalten"
      subtitle="Adminbereich"
      showHeader={false}
    >
      <AdminPageHeader
        eyebrow="Trainer"
        title="Trainer verwalten"
        description="Trainer- und Betreuerprofile pflegen und Zuordnungen zu Mannschaften prüfen."
        actions={
          canCreateCoaches ? (
            <Can permission="coaches.create" uiOnly>
              <Link
                href="/admin/coaches/new"
                className="rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
              >
                Neuer Trainer
              </Link>
            </Can>
          ) : null
        }
      />

      <AdminCoachesOverview coaches={coachList} />
    </AdminLayout>
  );
}
