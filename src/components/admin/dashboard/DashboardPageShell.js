import DashboardHeader from "./DashboardHeader";
import DashboardStatGrid from "./DashboardStatGrid";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardMembershipRequests from "./DashboardMembershipRequests";
import DashboardUpcomingEvents from "./DashboardUpcomingEvents";
import DashboardNewsOverview from "./DashboardNewsOverview";
import DashboardSystemStatus from "./DashboardSystemStatus";
import ContributionDashboardPanel from "@/components/admin/contributions/components/ContributionDashboardPanel";

export default function DashboardPageShell({
  now,
  stats,
  openMembershipRequests,
  upcomingEvents,
  latestNews,
  draftOrPlannedNews,
  statusSignals,
  contributionStats,
}) {
  return (
    <div className="space-y-8">
      <DashboardHeader now={now} />

      <DashboardStatGrid stats={stats} />

      <ContributionDashboardPanel stats={contributionStats} />

      <DashboardQuickActions />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardMembershipRequests requests={openMembershipRequests} />
        <DashboardUpcomingEvents events={upcomingEvents} now={now} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardNewsOverview
          latestNews={latestNews}
          draftOrPlannedNews={draftOrPlannedNews}
          now={now}
        />
        <DashboardSystemStatus statusSignals={statusSignals} />
      </div>
    </div>
  );
}
