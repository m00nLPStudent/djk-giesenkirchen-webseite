import DashboardGreeting from "./DashboardGreeting";
import DashboardNoticeList from "./DashboardNoticeList";
import DashboardQuickLinks from "./DashboardQuickLinks";
import DashboardUpcomingList from "./DashboardUpcomingList";
import DashboardRecentNewsList from "./DashboardRecentNewsList";
import DashboardContributionSummary from "./DashboardContributionSummary";
import DashboardRecentItems from "./DashboardRecentItems";

export default function DashboardPageShell({ dashboard }) {
  const hasMainContent = dashboard.upcomingEvents.length || dashboard.recentNews.length;
  return (
    <div className="space-y-5" data-dashboard-layout="compact-workspace">
      <DashboardGreeting greeting={dashboard.greeting} generatedAt={dashboard.generatedAt} />
      <DashboardNoticeList notices={dashboard.notices} />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
        <div className="min-w-0 space-y-5">
          {dashboard.upcomingEvents.length ? <DashboardUpcomingList events={dashboard.upcomingEvents} /> : null}
          {dashboard.recentNews.length ? <DashboardRecentNewsList news={dashboard.recentNews} /> : null}
          {!hasMainContent ? <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/55">Aktuell sind keine Termine oder Inhalte für deinen Zugriff vorhanden.</p> : null}
        </div>
        <aside className="min-w-0 space-y-5" aria-label="Persönliche Dashboard-Bereiche">
          <DashboardQuickLinks links={dashboard.quickLinks} />
          {dashboard.contributionSummary ? <DashboardContributionSummary summary={dashboard.contributionSummary} /> : null}
          {dashboard.recentItems.length ? <DashboardRecentItems items={dashboard.recentItems} /> : null}
        </aside>
      </div>
    </div>
  );
}
