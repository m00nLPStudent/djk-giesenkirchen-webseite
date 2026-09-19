"use client";

import { useRef, useState } from "react";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import { CURRENT_DASHBOARD_CHANGELOG } from "@/lib/admin-changelog/dashboardChangelog.config.mjs";
import { shouldShowDashboardChangelog } from "@/lib/admin-changelog/dashboardChangelog.core.mjs";
import { acknowledgeCurrentDashboardChangelog } from "@/lib/admin-changelog/dashboardChangelog.service";
import DashboardChangelogDialog from "./DashboardChangelogDialog";

export default function DashboardChangelogGate() {
  const { isReady, userContext, updateOwnProfile } = useAdminUiContext();
  const [confirmedVersion, setConfirmedVersion] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  const profile = userContext?.profile || null;
  const acknowledgedVersion =
    confirmedVersion ||
    profile?.last_acknowledged_dashboard_changelog_version ||
    null;
  const canCheck = Boolean(
    isReady &&
      userContext?.session &&
      userContext?.hasAdminProfile &&
      userContext?.isActive &&
      profile?.id,
  );
  const open =
    canCheck && shouldShowDashboardChangelog(acknowledgedVersion);

  async function handleConfirm() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError("");

    const result = await acknowledgeCurrentDashboardChangelog();

    if (!result.ok) {
      submittingRef.current = false;
      setBusy(false);
      setError(result.error);
      return;
    }

    updateOwnProfile({
      last_acknowledged_dashboard_changelog_version: result.version,
    });
    setConfirmedVersion(result.version);
    setBusy(false);
    submittingRef.current = false;
  }

  if (!open) return null;

  return (
    <DashboardChangelogDialog
      changelog={CURRENT_DASHBOARD_CHANGELOG}
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
    />
  );
}
