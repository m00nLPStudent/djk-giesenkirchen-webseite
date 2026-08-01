import {
  deleteTeamContactImage,
  deleteTeamImage,
} from "@/components/admin/teams/services/teams.service";
import {
  executeSafeTeamDeleteOrArchiveCore,
  loadTeamDependencySummary,
} from "./teamDelete.core.mjs";

export { loadTeamDependencySummary } from "./teamDelete.core.mjs";

async function archiveTeam(db, teamId) {
  const { error } = await db
    .from("teams")
    .update({ is_active: false })
    .eq("id", teamId);

  return { error: error || null };
}

async function hardDeleteTeamAndCleanupMedia(db, team) {
  const { error: deleteError } = await db
    .from("teams")
    .delete()
    .eq("id", team?.id);

  if (deleteError) {
    return { error: deleteError };
  }

  if (team?.team_image_url) {
    await deleteTeamImage(team.team_image_url);
  }

  if (team?.contact_image_url) {
    await deleteTeamContactImage(team.contact_image_url);
  }

  return { error: null };
}

export async function executeSafeTeamDeleteOrArchive(db, team) {
  return await executeSafeTeamDeleteOrArchiveCore(db, team, {
    archiveTeam,
    hardDeleteTeam: hardDeleteTeamAndCleanupMedia,
    loadDependencies: loadTeamDependencySummary,
  });
}
