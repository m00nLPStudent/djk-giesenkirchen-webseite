import { runDashboardChangelogAcknowledgement } from "./dashboardChangelog.core.mjs";
import { acknowledgeDashboardChangelogVersion } from "./dashboardChangelog.repository";

const ACKNOWLEDGEMENT_ERROR =
  "Die Bestätigung konnte nicht gespeichert werden. Bitte versuche es erneut.";

export async function acknowledgeCurrentDashboardChangelog() {
  try {
    const result = await runDashboardChangelogAcknowledgement(
      acknowledgeDashboardChangelogVersion,
    );

    if (!result.ok) {
      return { ok: false, error: ACKNOWLEDGEMENT_ERROR };
    }

    return result;
  } catch {
    return { ok: false, error: ACKNOWLEDGEMENT_ERROR };
  }
}
