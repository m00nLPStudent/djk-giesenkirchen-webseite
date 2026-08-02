export const CONTRIBUTION_FILTERS_DEFAULT_EXPANDED = false;

export function countActiveContributionFilters(filters = {}, filterOptions = {}) {
  const currentSeasonId =
    (filterOptions.seasons || []).find((season) => season.isCurrent)?.value || "";

  return [
    filters.seasonId && filters.seasonId !== currentSeasonId ? filters.seasonId : "",
    filters.playerId,
    filters.teamSnapshotName,
    filters.status,
    filters.contributionKey,
    filters.dueDate,
    filters.search,
    filters.overdue ? "true" : "",
    filters.sort && filters.sort !== "default" ? filters.sort : "",
    filters.pageSize && Number(filters.pageSize) !== 25 ? filters.pageSize : "",
  ].filter(Boolean).length;
}

export function getContributionFilterBadgeLabel(filters = {}, filterOptions = {}) {
  const activeFilterCount = countActiveContributionFilters(filters, filterOptions);
  return activeFilterCount > 0 ? `${activeFilterCount} Filter aktiv` : "";
}

