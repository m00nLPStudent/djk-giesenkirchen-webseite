import { supabase } from "@/lib/supabase";

export async function removePlayerRecord(player) {
  return await supabase.rpc("remove_player_cascade", { player_uuid: player?.id });
}

export async function removeCoachRecord(coach) {
  return await supabase.rpc("remove_coach_cascade", { coach_uuid: coach?.id });
}

export async function removeTeamRecord(team) {
  return await supabase.rpc("remove_team_cascade", { team_uuid: team?.id });
}

export async function removeNewsRecord(news) {
  return await supabase.rpc("remove_news_cascade", { news_uuid: news?.id });
}
