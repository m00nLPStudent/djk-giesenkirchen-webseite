const clean = (value) => String(value || "").trim();

export function resolveGreeting(hour) {
  const normalizedHour = Number(hour);
  if (normalizedHour < 12) return "Guten Morgen";
  if (normalizedHour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function resolveDashboardDisplayName(profile = {}) {
  const explicit = clean(profile.display_name || profile.displayName || profile.first_name || profile.firstName);
  if (explicit) return explicit.split(/\s+/)[0];
  const fullName = clean(profile.full_name || profile.fullName || profile.name);
  return fullName ? fullName.split(/\s+/)[0] : null;
}

export function resolveDashboardIntro({ permissionKeys = [], scopeContext = {}, navigation = {} } = {}) {
  const permissions = new Set(permissionKeys);
  const itemCount = (navigation.sections || []).flatMap((section) => section.items || []).length;
  if (scopeContext.isGlobal) return "Hier findest du die wichtigsten Bereiche und offenen Punkte im gesamten CMS.";
  if (scopeContext.canAccessYouthAll) return "Hier siehst du Jugendmannschaften, Spieler und offene Aufgaben im Jugendbereich.";
  if ((scopeContext.assignedTeamIds || []).length || (scopeContext.roleScopeTypes || []).includes("own_staff_card")) {
    return "Hier findest du deine Mannschaften, Spieler und anstehenden Termine.";
  }
  if (permissions.has("contributions.view") && itemCount <= 4) {
    return "Hier siehst du offene Beitragsfälle und deine wichtigsten Finanzaufgaben.";
  }
  if (permissions.has("settings.view") || permissions.has("news.view")) {
    return "Hier findest du aktuelle Vereinsinformationen und offene Verwaltungsaufgaben.";
  }
  return "Hier findest du die für dich freigegebenen Bereiche und aktuellen Informationen.";
}

export function canViewMembershipRequestsOnDashboard({ permissionKeys = [], roleKeys = [], scopeContext = {} } = {}) {
  return canAccessMembershipRequests({ permissionKeys, roleKeys, scopeContext });
}

export function canOpenMembershipRequestTarget({ permissionKeys = [], roleKeys = [], scopeContext = {} } = {}) {
  return canAccessMembershipRequests({ permissionKeys, roleKeys, scopeContext });
}

export async function loadMembershipRequestCountForDashboard({ allowed, loadCount }) {
  if (!allowed) return 0;
  return typeof loadCount === "function" ? await loadCount() : 0;
}

export function createDashboardQueryPlan(permissionKeys = [], accessContext = {}) {
  const permissions = new Set(permissionKeys);
  return {
    profile: true,
    contributions: permissions.has("contributions.view"),
    events: permissions.has("events.view"),
    news: permissions.has("news.view"),
    membershipRequests: canViewMembershipRequestsOnDashboard({ permissionKeys, ...accessContext }),
    teams: false,
  };
}

export function buildDashboardNotices({ contributionSummary, membershipOpenCount = 0, membershipTargetAvailable = false } = {}) {
  const notices = [];
  if (contributionSummary?.overdueCount > 0) notices.push({ key: "contributions-overdue", tone: "danger", count: contributionSummary.overdueCount, text: "überfällige Beitragsfälle", href: "/admin/contributions" });
  if (contributionSummary?.openCount > 0) notices.push({ key: "contributions-open", tone: "warning", count: contributionSummary.openCount, text: "offene Beitragsfälle", href: "/admin/contributions" });
  if (membershipOpenCount > 0) notices.push({ key: "membership-open", tone: "info", count: membershipOpenCount, text: "offene Mitgliedsanfragen", href: membershipTargetAvailable ? "/admin/membership-requests" : null });
  return notices;
}

export function buildDashboardQuickLinks(navigation = {}, limit = 8) {
  return (navigation.sections || []).flatMap((section) =>
    (section.items || []).filter((item) => item.status === "active" && item.href !== "/admin")
      .map((item) => ({ key: item.key, label: item.label, href: item.href, icon: item.icon, section: section.label })),
  ).slice(0, limit);
}

export function buildRecentItems({ news = [], events = [] } = {}) {
  return [
    ...news.map((item) => ({ key: `news-${item.id}`, title: item.title, module: "News", timestamp: item.updatedAt || item.publishedAt, href: item.href })),
    ...events.map((item) => ({ key: `event-${item.id}`, title: item.title, module: "Termine", timestamp: item.updatedAt || item.startsAt, href: item.href })),
  ].filter((item) => item.timestamp).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
}

export function createDashboardDto(input = {}) {
  const dto = {
    greeting: input.greeting || { text: "Guten Tag", displayName: null, intro: "" },
    notices: input.notices || [], quickLinks: input.quickLinks || [],
    upcomingEvents: input.upcomingEvents || [], recentNews: input.recentNews || [],
    contributionSummary: input.contributionSummary || null, recentItems: input.recentItems || [],
    generatedAt: input.generatedAt || null,
  };
  return JSON.parse(JSON.stringify(dto));
}
import { canAccessMembershipRequests } from "../../../lib/admin-auth/membershipAccess.js";
