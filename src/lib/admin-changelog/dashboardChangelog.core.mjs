import { CURRENT_DASHBOARD_CHANGELOG } from "./dashboardChangelog.config.mjs";

export function shouldShowDashboardChangelog(
  acknowledgedVersion,
  currentVersion = CURRENT_DASHBOARD_CHANGELOG.version,
) {
  return acknowledgedVersion !== currentVersion;
}

export function isSuccessfulDashboardChangelogAcknowledgement(
  acknowledgedVersion,
  currentVersion = CURRENT_DASHBOARD_CHANGELOG.version,
) {
  return acknowledgedVersion === currentVersion;
}

export async function runDashboardChangelogAcknowledgement(
  acknowledgeVersion,
  currentVersion = CURRENT_DASHBOARD_CHANGELOG.version,
) {
  try {
    const result = await acknowledgeVersion(currentVersion);
    if (
      result?.error ||
      !isSuccessfulDashboardChangelogAcknowledgement(
        result?.data,
        currentVersion,
      )
    ) {
      return { ok: false };
    }

    return { ok: true, version: currentVersion };
  } catch {
    return { ok: false };
  }
}
