import AdminLayout from "@/components/admin/layout/AdminLayout";
import DashboardWelcome from "@/components/admin/dashboard/DashboardWelcome";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import DashboardLatestNews from "@/components/admin/dashboard/DashboardLatestNews";
import DashboardPlannedNews from "@/components/admin/dashboard/DashboardPlannedNews";
import DashboardQuickActions from "@/components/admin/dashboard/DashboardQuickActions";
import DashboardSystemStatus from "@/components/admin/dashboard/DashboardSystemStatus";
import DashboardToday from "@/components/admin/dashboard/DashboardToday";
import { expandRecurringEvents } from "@/lib/events";
import { supabase } from "@/lib/supabase";

async function getCount(table) {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  return count || 0;
}

export default async function AdminPage() {
  const [newsCount, teamsCount, coachesCount, playersCount] = await Promise.all(
    [
      getCount("news"),
      getCount("teams"),
      getCount("coaches"),
      getCount("players"),
    ],
  );

  const { data: latestNews } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: plannedNews } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .gt("published_at", new Date().toISOString())
    .order("published_at", { ascending: true })
    .limit(5);

  const { data: dashboardEvents } = await supabase
    .from("events")
    .select(
      "id, title_de, event_type, starts_at, ends_at, is_all_day, location_name, location_city, recurrence_type, recurrence_interval, recurrence_until, recurrence_count",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .limit(100);

  const now = new Date();
  const upcomingEvents = expandRecurringEvents(dashboardEvents || [], {
    from: now,
    to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxOccurrencesPerEvent: 120,
  }).slice(0, 5);

  const counts = {
    news: newsCount,
    teams: teamsCount,
    coaches: coachesCount,
    players: playersCount,
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Adminbereich">
      <DashboardWelcome plannedNewsCount={plannedNews?.length || 0} />

      <DashboardStats counts={counts} />

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <DashboardLatestNews news={latestNews || []} />
        <DashboardPlannedNews news={plannedNews || []} />
      </div>

      <DashboardQuickActions />

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <DashboardToday events={upcomingEvents} />
        <DashboardSystemStatus />
      </div>
    </AdminLayout>
  );
}
