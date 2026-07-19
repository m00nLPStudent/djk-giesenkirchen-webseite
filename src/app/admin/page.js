import AdminLayout from "@/components/admin/layout/AdminLayout";
import {
  filterScopedTeamsOnServer,
  loadServerTeamScopeContext,
  resolveTeamScopeType,
} from "@/components/admin/teams/serverTeamScope";
import DashboardPageShell from "@/components/admin/dashboard/DashboardPageShell";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  expandRecurringEvents,
  getVirtualTrainingEvents,
  mergeEventsWithVirtualTrainings,
} from "@/lib/events";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getCount(table, applyFilters) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (typeof applyFilters === "function") {
    query = applyFilters(query);
  }

  const { count } = await query;
  return count || 0;
}

async function getScopedTeamsTotal() {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "teams.view",
  });
  if (!permissionResult.ok) {
    return 0;
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  const scopeType = resolveTeamScopeType(scopeContext);
  const db = permissionResult.supabaseServer;

  if (scopeType === "none") {
    return 0;
  }

  let teamsQuery = db
    .from("teams")
    .select("id, age_group, name_de")
    .eq("is_active", true);

  if (scopeType === "assigned_teams") {
    const assignedTeamIds = scopeContext?.assignedTeamIds || [];
    if (!assignedTeamIds.length) {
      return 0;
    }
    teamsQuery = teamsQuery.in("id", assignedTeamIds);
  }

  const { data: teams, error } = await teamsQuery;
  if (error) {
    return 0;
  }

  return filterScopedTeamsOnServer(scopeContext, teams || []).length;
}

export default async function AdminPage() {
  const now = new Date();
  const nowIso = now.toISOString();

  const [
    newsTotal,
    newsPublishedWithDate,
    newsPublishedWithoutDate,
    newsPlanned,
    newsDraft,
    teamsTotal,
    coachesTotal,
    sponsorsTotal,
    eventsTotal,
    membershipOpenTotal,
    recipientActiveTotal,
  ] = await Promise.all([
    getCount("news"),
    getCount("news", (query) =>
      query.eq("is_published", true).lte("published_at", nowIso),
    ),
    getCount("news", (query) =>
      query.eq("is_published", true).is("published_at", null),
    ),
    getCount("news", (query) =>
      query.eq("is_published", true).gt("published_at", nowIso),
    ),
    getCount("news", (query) => query.eq("is_published", false)),
    getScopedTeamsTotal(),
    getCount("coaches"),
    getCount("sponsors"),
    getCount("events"),
    getCount("membership_requests", (query) =>
      query.in("status", ["new", "in_progress"]),
    ),
    getCount("membership_request_recipients", (query) =>
      query.eq("is_active", true),
    ),
  ]);

  const newsPublished = newsPublishedWithDate + newsPublishedWithoutDate;
  const newsPlannedOrDraft = newsPlanned + newsDraft;

  const { data: latestNews } = await supabase
    .from("news")
    .select("id, title_de, category, is_published, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: draftOrPlannedNews } = await supabase
    .from("news")
    .select("id, title_de, category, is_published, published_at, created_at")
    .or(
      `is_published.eq.false,and(is_published.eq.true,published_at.gt.${nowIso})`,
    )
    .order("published_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: latestOpenMembershipRequests } = await supabase
    .from("membership_requests")
    .select(
      "id, first_name, last_name, request_type, status, created_at, teams(name_de)",
    )
    .in("status", ["new", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: dashboardEvents } = await supabase
    .from("events")
    .select(
      "id, title_de, event_type, starts_at, ends_at, is_all_day, location_name, location_city, recurrence_type, recurrence_interval, recurrence_until, recurrence_count",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .limit(100);

  const from = now;
  const to = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const expandedEvents = expandRecurringEvents(dashboardEvents || [], {
    from: now,
    to,
    maxOccurrencesPerEvent: 120,
  });
  const upcomingRealEvents = expandedEvents.filter(
    (event) => new Date(event.starts_at) >= now,
  );
  const virtualTrainings = await getVirtualTrainingEvents({
    from,
    to,
    maxOccurrencesPerTraining: 120,
  });
  const upcomingEvents = mergeEventsWithVirtualTrainings(
    upcomingRealEvents,
    virtualTrainings,
  ).slice(0, 8);

  const { data: legalPages } = await supabase
    .from("pages")
    .select("slug, is_published")
    .in("slug", ["impressum", "datenschutz"]);

  const pageBySlug = Object.fromEntries(
    (legalPages || []).map((page) => [page.slug, page]),
  );

  const stats = {
    newsTotal,
    newsPublished,
    newsPlannedOrDraft,
    teamsTotal,
    coachesTotal,
    sponsorsTotal,
    eventsTotal,
    membershipOpenTotal,
  };

  const statusSignals = {
    impressumPublished: Boolean(pageBySlug.impressum?.is_published),
    datenschutzPublished: Boolean(pageBySlug.datenschutz?.is_published),
    membershipOpenTotal,
    newsPlannedOrDraft,
    hasActiveMembershipRecipients: recipientActiveTotal > 0,
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Adminbereich" showHeader={false}>
      <DashboardPageShell
        now={now}
        stats={stats}
        openMembershipRequests={latestOpenMembershipRequests || []}
        upcomingEvents={upcomingEvents}
        latestNews={latestNews || []}
        draftOrPlannedNews={draftOrPlannedNews || []}
        statusSignals={statusSignals}
      />
    </AdminLayout>
  );
}
