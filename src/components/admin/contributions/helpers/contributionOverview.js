export const CONTRIBUTION_OVERVIEW_TABLE_BREAKPOINT = "lg";

export const CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS = [
  { key: "player", label: "Spieler" },
  { key: "status", label: "Status" },
  { key: "outstanding", label: "Offen" },
  { key: "details", label: "Uebersicht" },
];

export function getContributionOverviewHref(contributionId) {
  return `/admin/contributions/${contributionId}`;
}
