import AdminLayout from "@/components/admin/layout/AdminLayout";
import { AdminTeamsForm } from "@/components/admin/teams";
import BackButton from "@/components/admin/ui/BackButton";
import { supabase } from "@/lib/supabase";

export default async function EditTeamPage({ params }) {
  const { id } = await params;

  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: teamSeasons } = await supabase
    .from("team_seasons")
    .select("*")
    .eq("team_id", id);

  const ids = (teamSeasons || []).map((item) => item.id);

  const { data: playerAssignments } = ids.length
    ? await supabase.from("player_team_seasons").select("*").in("team_season_id", ids)
    : { data: [] };

  const { data: coachAssignments } = ids.length
    ? await supabase.from("coach_team_seasons").select("*").in("team_season_id", ids)
    : { data: [] };

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  const { data: coaches } = await supabase
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  return (
    <AdminLayout title="Mannschaft bearbeiten" subtitle="Mannschaften">
      <BackButton />
      <AdminTeamsForm
        team={team}
        seasons={seasons || []}
        teamSeasons={teamSeasons || []}
        players={players || []}
        coaches={coaches || []}
        playerAssignments={playerAssignments || []}
        coachAssignments={coachAssignments || []}
      />
    </AdminLayout>
  );
}
