import "server-only";

import { cache } from "react";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadAdminProfileScopeContext } from "@/lib/admin-auth/scopes";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadContributionStats } from "@/components/admin/contributions/services/contributionStats.service";
import { ADMIN_NAVIGATION_SECTIONS } from "@/components/admin/navigation/adminNavigation.config";
import { resolveAdminNavigation } from "@/components/admin/navigation/adminNavigation.resolver";
import {
  buildDashboardNotices, buildDashboardQuickLinks, buildRecentItems, canOpenMembershipRequestTarget,
  createDashboardDto, createDashboardQueryPlan, resolveDashboardDisplayName,
  loadMembershipRequestCountForDashboard, resolveDashboardIntro, resolveGreeting,
} from "./dashboard.core";

const permissionKeys = (auth) => (auth?.permissions || []).map((item) => item?.key || item).filter(Boolean);
const roleKeys = (auth) => (auth?.roles || []).map((item) => item?.key).filter(Boolean);

function berlinHour(now) {
  return Number(new Intl.DateTimeFormat("de-DE", { hour: "2-digit", hour12: false, timeZone: "Europe/Berlin" }).format(now));
}

async function loadProfileName(db, profileId) {
  if (!profileId) return {};
  const { data } = await db.from("admin_profiles").select("full_name").eq("id", profileId).maybeSingle();
  return data || {};
}

async function loadEvents(db, nowIso, canEdit) {
  const { data } = await db.from("events")
    .select("id, title_de, starts_at, is_all_day, location_name, location_city")
    .eq("is_published", true).gte("starts_at", nowIso).order("starts_at", { ascending: true }).limit(5);
  return (data || []).map((item) => ({ id: item.id, title: item.title_de || "Unbenannter Termin", startsAt: item.starts_at, isAllDay: Boolean(item.is_all_day), location: [item.location_name, item.location_city].filter(Boolean).join(", ") || null, href: canEdit ? `/admin/events/edit/${item.id}` : "/admin/events" }));
}

async function loadNews(db, canEdit) {
  const { data } = await db.from("news")
    .select("id, title_de, is_published, published_at, created_at")
    .order("created_at", { ascending: false }).limit(5);
  return (data || []).map((item) => ({ id: item.id, title: item.title_de || "Unbenannte News", status: item.is_published ? "Veröffentlicht" : "Entwurf", publishedAt: item.published_at || item.created_at, updatedAt: item.created_at, href: canEdit ? `/admin/news/edit/${item.id}` : "/admin/news" }));
}

async function loadMembershipCount(db) {
  const { count } = await db.from("membership_requests").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]);
  return count || 0;
}

async function loadContributionSummary() {
  const db = createSupabaseAdminClient();
  if (!db) return null;
  const stats = await loadContributionStats(db);
  return { openCount: stats.openCount, partiallyPaidCount: stats.partiallyPaidCount, overdueCount: stats.overdueCount, totalOutstanding: stats.totalOutstanding };
}

export const loadDashboard = cache(async () => {
  const auth = await assertAdminActionPermission({ requiredPermission: "dashboard.view" });
  if (!auth.ok) return { navigation: { sections: [] }, dashboard: createDashboardDto() };
  const permissions = permissionKeys(auth);
  const roles = roleKeys(auth);
  const scopeResult = await loadAdminProfileScopeContext({ adminProfileId: auth.profile?.id, userId: auth.userId, roleKeys: roles, permissionKeys: permissions, supabase: auth.supabaseServer });
  const navigation = resolveAdminNavigation({ sections: ADMIN_NAVIGATION_SECTIONS, permissionKeys: permissions, roleKeys: roles, scopeContext: scopeResult.context, currentPath: "/admin" });
  const accessContext = { roleKeys: roles, scopeContext: scopeResult.context };
  const plan = createDashboardQueryPlan(permissions, accessContext);
  const now = new Date();
  const [profile, contributionSummary, upcomingEvents, recentNews, membershipOpenCount] = await Promise.all([
    loadProfileName(auth.supabaseServer, auth.profile?.id),
    plan.contributions ? loadContributionSummary() : null,
    plan.events ? loadEvents(auth.supabaseServer, now.toISOString(), permissions.includes("events.edit")) : [],
    plan.news ? loadNews(auth.supabaseServer, permissions.includes("news.edit")) : [],
    loadMembershipRequestCountForDashboard({ allowed: plan.membershipRequests, loadCount: () => loadMembershipCount(auth.supabaseServer) }),
  ]);
  const displayName = resolveDashboardDisplayName(profile);
  const notices = buildDashboardNotices({
    contributionSummary,
    membershipOpenCount,
    membershipTargetAvailable: canOpenMembershipRequestTarget({ permissionKeys: permissions, roleKeys: roles, scopeContext: scopeResult.context }),
  });
  const quickLinks = buildDashboardQuickLinks(navigation);
  const recentItems = buildRecentItems({ news: recentNews, events: upcomingEvents });
  return { navigation, dashboard: createDashboardDto({
    greeting: { text: resolveGreeting(berlinHour(now)), displayName, intro: resolveDashboardIntro({ permissionKeys: permissions, scopeContext: scopeResult.context, navigation }) },
    notices, quickLinks, upcomingEvents, recentNews, contributionSummary, recentItems, generatedAt: now.toISOString(),
  }) };
});
