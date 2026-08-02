import { loadContributionStats } from "./contributionStats.service.js";
import { loadFilteredContributions } from "../repositories/contributionsRead.repository.js";
import { loadContributionPlayerOptions } from "./contributionPlayerOptions.service.js";
import {
  applyContributionSearch,
  paginateContributions,
  parseContributionListSearchParams,
  sortContributions,
} from "../helpers/contributionFilters.js";

function sortSeasonOptions(left, right) {
  if (left.isCurrent !== right.isCurrent) {
    return left.isCurrent ? -1 : 1;
  }

  return String(right.label || "").localeCompare(String(left.label || ""), "de");
}

async function loadCurrentSeasonResolutionDefault(db) {
  const seasonRepository = await import("../../persons/currentSeasonRepository.js");
  return seasonRepository.loadCurrentSeasonResolution(db);
}

export async function loadContributionFormOptions(db, deps = {}) {
  const repository = {
    loadCurrentSeasonResolution: loadCurrentSeasonResolutionDefault,
    loadContributionPlayerOptions,
    ...deps,
  };
  const [seasonResolution, seasonsResult, playersResult] = await Promise.all([
    repository.loadCurrentSeasonResolution(db),
    db
      .from("seasons")
      .select("id, name, is_current")
      .order("name", { ascending: false }),
    db
      .from("players")
      .select("id, first_name, last_name, is_active")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
  ]);

  if (seasonsResult.error) {
    throw new Error(`seasons query failed: ${seasonsResult.error.message}`);
  }

  if (playersResult.error) {
    throw new Error(`players query failed: ${playersResult.error.message}`);
  }

  return {
    currentSeasonId: seasonResolution.activeSeasonId || null,
    currentSeasonStatus: seasonResolution.activeSeasonStatus || null,
    seasons: (seasonsResult.data || [])
      .map((season) => ({
        value: season.id,
        label: season.name || "Saison",
        isCurrent: Boolean(season.is_current),
      }))
      .sort(sortSeasonOptions),
    players: await repository.loadContributionPlayerOptions(
      db,
      playersResult.data || [],
    ),
  };
}

export async function loadContributionTeamSnapshotOptions(db) {
  const { data, error } = await db
    .from("player_contributions")
    .select("team_snapshot_name")
    .not("team_snapshot_name", "is", null);

  if (error) {
    throw new Error(`team snapshot query failed: ${error.message}`);
  }

  return Array.from(
    new Set(
      (data || [])
        .map((row) => String(row.team_snapshot_name || "").trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "de"));
}

async function loadContributionCollectionData(db, rawSearchParams = {}, deps = {}) {
  const repository = {
    loadContributionFormOptions,
    loadFilteredContributions,
    ...deps,
  };
  const formOptions = await repository.loadContributionFormOptions(db);
  const filters = parseContributionListSearchParams(
    rawSearchParams,
    formOptions.currentSeasonId,
  );
  const contributions = await repository.loadFilteredContributions(db, {
    seasonId: filters.seasonId || undefined,
    playerId: filters.playerId || undefined,
    status: filters.status || undefined,
    contributionKey: filters.contributionKey || undefined,
    dueDate: filters.dueDate || undefined,
    overdue: filters.overdue,
    teamSnapshotName: filters.teamSnapshotName || undefined,
  });

  const searched = applyContributionSearch(contributions, filters.search);
  const sorted = sortContributions(searched, filters.sort);

  return {
    filters,
    contributions: sorted,
    formOptions,
    hasAnyContributions: contributions.length > 0,
  };
}

export async function loadContributionsOverviewData(
  db,
  rawSearchParams = {},
  deps = {},
) {
  const repository = {
    loadContributionTeamSnapshotOptions,
    ...deps,
  };
  const collection = await loadContributionCollectionData(
    db,
    rawSearchParams,
    deps,
  );
  const paginated = paginateContributions(
    collection.contributions,
    collection.filters.page,
    collection.filters.pageSize,
  );
  const stats = await loadContributionStats(
    db,
    collection.filters.seasonId ? { seasonId: collection.filters.seasonId } : {},
    {
      async loadFilteredContributions() {
        return collection.contributions;
      },
      async loadCurrentSeasonResolution() {
        return {
          activeSeasonId: collection.formOptions.currentSeasonId,
        };
      },
    },
  );

  return {
    filters: collection.filters,
    stats,
    contributions: paginated.items,
    pagination: paginated.pagination,
    filterOptions: {
      seasons: collection.formOptions.seasons,
      players: collection.formOptions.players,
      teams: await repository.loadContributionTeamSnapshotOptions(db),
    },
    currentSeasonId: collection.formOptions.currentSeasonId,
    currentSeasonStatus: collection.formOptions.currentSeasonStatus,
    hasAnyContributions: collection.hasAnyContributions,
  };
}

export async function loadContributionsExportData(
  db,
  rawSearchParams = {},
  deps = {},
) {
  const collection = await loadContributionCollectionData(
    db,
    rawSearchParams,
    deps,
  );

  return {
    filters: collection.filters,
    contributions: collection.contributions,
  };
}
