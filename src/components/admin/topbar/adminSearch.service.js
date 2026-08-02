import { createCoachReadDto } from "@/components/admin/persons/coachReadDto";
import { createPlayerReadDto } from "@/components/admin/persons/playerReadDto";
import {
  buildCoachAssignments,
  buildCurrentSeasonResolution,
  buildPlayerAssignments,
} from "@/components/admin/persons/seasonalReadModelCore.mjs";
import { supabase } from "@/lib/supabase";
import { loadNewsCategories } from "@/components/admin/news/services/newsCategories.repository";
import { resolveNewsCategoryLabel } from "@/components/admin/news/helpers/newsCategories.core";
import { loadEventTypes } from "@/components/admin/events/services/eventTypes.repository";
import { resolveEventTypeLabel } from "@/components/admin/events/helpers/eventTypes.core";

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().trim();
}

function matches(value, query) {
  return normalize(value).includes(normalize(query));
}

function mapResult({ type, title, subtitle, href }) {
  return { type, title, subtitle, href };
}

function createCoachSubtitle(coach = {}) {
  if ((coach.teamNames || []).length <= 1) return coach.primaryTeamName || coach.primaryRoleLabel || "Trainer";
  return `${coach.primaryTeamName} +${coach.teamNames.length - 1} weitere`;
}

function createPlayerSubtitle(player = {}) {
  if ((player.teamNames || []).length <= 1) return player.primaryTeamName || "Spielerprofil";
  return `${player.primaryTeamName} +${player.teamNames.length - 1} weitere`;
}

async function loadPlayerSearchDtos(players = []) {
  const playerIds = (players || []).map((player) => player.id).filter(Boolean);
  if (playerIds.length === 0) return [];

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, slug, is_current")
    .eq("is_current", true);

  const seasonResolution = buildCurrentSeasonResolution(seasons || []);
  if (!seasonResolution.activeSeasonId) {
    return players.map((player) => createPlayerReadDto(player));
  }

  const { data: playerAssignments } = await supabase
    .from("player_team_seasons")
    .select("id, player_id, team_season_id, shirt_number, position_de, position_en, is_captain, is_active, sort_order, created_at")
    .in("player_id", playerIds)
    .eq("is_active", true);

  const teamSeasonIds = Array.from(
    new Set(
      (playerAssignments || [])
        .map((assignment) => assignment?.team_season_id)
        .filter(Boolean),
    ),
  );

  const { data: teamSeasons } = teamSeasonIds.length
    ? await supabase
        .from("team_seasons")
        .select("id, team_id, season_id, name_de, name_en, slug, age_group, is_active")
        .in("id", teamSeasonIds)
        .eq("is_active", true)
    : { data: [] };

  const teamIds = Array.from(
    new Set(
      (teamSeasons || []).map((teamSeason) => teamSeason?.team_id).filter(Boolean),
    ),
  );

  const { data: teams } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name_de, name_en, slug, age_group, is_active")
        .in("id", teamIds)
        .eq("is_active", true)
    : { data: [] };

  const assignmentsByPlayerId = buildPlayerAssignments({
    assignmentRows: playerAssignments || [],
    teamSeasonsById: new Map((teamSeasons || []).map((row) => [row.id, row])),
    teamsById: new Map((teams || []).map((row) => [row.id, row])),
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonName: seasonResolution.activeSeasonName,
  });

  return players.map((player) => {
    const assignments = assignmentsByPlayerId.get(player.id) || [];

    return createPlayerReadDto(player, {
      assignments,
      hasActiveAssignment: assignments.length > 0,
      hasMultipleActiveAssignments: assignments.length > 1,
      activeSeasonStatus: seasonResolution.activeSeasonStatus,
    });
  });
}

async function loadCoachSearchDtos(coaches = []) {
  const coachIds = (coaches || []).map((coach) => coach.id).filter(Boolean);
  if (coachIds.length === 0) return [];

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, slug, is_current")
    .eq("is_current", true);

  const seasonResolution = buildCurrentSeasonResolution(seasons || []);
  if (!seasonResolution.activeSeasonId) {
    return coaches.map((coach) => createCoachReadDto(coach));
  }

  const { data: coachAssignments } = await supabase
    .from("coach_team_seasons")
    .select("id, coach_id, team_season_id, role_de, role_en, is_active, sort_order, created_at")
    .in("coach_id", coachIds)
    .eq("is_active", true);

  const teamSeasonIds = Array.from(
    new Set(
      (coachAssignments || [])
        .map((assignment) => assignment?.team_season_id)
        .filter(Boolean),
    ),
  );

  const { data: teamSeasons } = teamSeasonIds.length
    ? await supabase
        .from("team_seasons")
        .select("id, team_id, season_id, name_de, name_en, slug, is_active")
        .in("id", teamSeasonIds)
        .eq("is_active", true)
    : { data: [] };

  const teamIds = Array.from(
    new Set(
      (teamSeasons || []).map((teamSeason) => teamSeason?.team_id).filter(Boolean),
    ),
  );

  const { data: teams } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name_de, name_en, slug, is_active")
        .in("id", teamIds)
        .eq("is_active", true)
    : { data: [] };

  const assignmentsByCoachId = buildCoachAssignments({
    assignmentRows: coachAssignments || [],
    teamSeasonsById: new Map((teamSeasons || []).map((row) => [row.id, row])),
    teamsById: new Map((teams || []).map((row) => [row.id, row])),
    activeSeasonId: seasonResolution.activeSeasonId,
    activeSeasonName: seasonResolution.activeSeasonName,
  });

  return coaches.map((coach) => {
    const assignments = assignmentsByCoachId.get(coach.id) || [];

    return createCoachReadDto(coach, {
      assignments,
      hasActiveAssignment: assignments.length > 0,
      hasMultipleActiveAssignments: assignments.length > 1,
      activeSeasonStatus: seasonResolution.activeSeasonStatus,
    });
  });
}

export async function searchAdminEntities(query) {
  const search = normalize(query);
  if (search.length < 2) return [];

  const [news, newsCategories, events, eventTypes, teams, players, coaches, sponsors, boardMembers] =
    await Promise.all([
      supabase.from("news").select("id, title_de, category_key").limit(20),
      loadNewsCategories(supabase),
      supabase.from("events").select("id, title_de, event_type").limit(20),
      loadEventTypes(supabase, { activeOnly: false }),
      supabase.from("teams").select("id, name_de, age_group").limit(20),
      supabase
        .from("players")
        .select("id, first_name, last_name, image_url, photo_url")
        .limit(20),
      supabase
        .from("coaches")
        .select("id, first_name, last_name, name, role, role_de, role_en, image_url, photo_url")
        .limit(20),
      supabase.from("sponsors").select("id, name").limit(20),
      supabase
        .from("board_members")
        .select("id, first_name, last_name, role_de")
        .limit(20),
    ]);

  const results = [];
  const playerDtos = await loadPlayerSearchDtos(players.data || []);
  const coachDtos = await loadCoachSearchDtos(coaches.data || []);
  const categoryLabel = (item) => resolveNewsCategoryLabel(newsCategories.data || [], item.category_key);

  (news.data || [])
    .filter(
      (item) => matches(item.title_de, search) || matches(categoryLabel(item), search),
    )
    .forEach((item) =>
      results.push(
        mapResult({
          type: "News",
          title: item.title_de || "Ohne Titel",
          subtitle: categoryLabel(item),
          href: `/admin/news/edit/${item.id}`,
        }),
      ),
    );

  const eventTypeLabel = (item) => resolveEventTypeLabel(eventTypes.data || [], item.event_type);
  (events.data || [])
    .filter((item) => matches(item.title_de, search) || matches(eventTypeLabel(item), search))
    .forEach((item) =>
      results.push(mapResult({
        type: "Termin",
        title: item.title_de || "Ohne Titel",
        subtitle: eventTypeLabel(item),
        href: `/admin/events/edit/${item.id}`,
      })),
    );

  (teams.data || [])
    .filter(
      (item) => matches(item.name_de, search) || matches(item.age_group, search),
    )
    .forEach((item) =>
      results.push(
        mapResult({
          type: "Mannschaft",
          title: item.name_de || "Mannschaft",
          subtitle: item.age_group || "Team",
          href: `/admin/teams/edit/${item.id}`,
        }),
      ),
    );

  playerDtos
    .filter((item) =>
      matches(item.displayName, search) ||
      matches(item.teamNames.join(" "), search),
    )
    .forEach((item) =>
      results.push(
        mapResult({
          type: "Spieler",
          title: item.displayName || "Spieler",
          subtitle: createPlayerSubtitle(item),
          href: `/admin/players/edit/${item.playerId}`,
        }),
      ),
    );

  coachDtos
    .filter(
      (item) =>
        matches(item.displayName, search) ||
        matches(item.teamNames.join(" "), search),
    )
    .forEach((item) =>
      results.push(
        mapResult({
          type: "Trainer",
          title: item.displayName || "Trainer",
          subtitle: createCoachSubtitle(item),
          href: `/admin/coaches/edit/${item.id}`,
        }),
      ),
    );

  (sponsors.data || [])
    .filter((item) => matches(item.name, search))
    .forEach((item) =>
      results.push(
        mapResult({
          type: "Sponsor",
          title: item.name || "Sponsor",
          subtitle: "Sponsor",
          href: `/admin/sponsors/edit/${item.id}`,
        }),
      ),
    );

  (boardMembers.data || [])
    .filter(
      (item) =>
        matches(`${item.first_name || ""} ${item.last_name || ""}`, search) ||
        matches(item.role_de, search),
    )
    .forEach((item) =>
      results.push(
        mapResult({
          type: "Vorstand",
          title:
            `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
            "Vorstand",
          subtitle: item.role_de || "Vorstand",
          href: `/admin/department/board/edit/${item.id}`,
        }),
      ),
    );

  return results.slice(0, 8);
}
