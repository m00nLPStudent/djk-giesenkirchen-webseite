const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [25, 50];

function readString(value) {
  const normalized = String(value || "").trim();
  return normalized || "";
}

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseContributionListSearchParams(
  searchParams = {},
  currentSeasonId = null,
) {
  const seasonId = readString(searchParams?.season) || currentSeasonId || "";
  const pageSizeCandidate = readPositiveInt(
    searchParams?.pageSize,
    DEFAULT_PAGE_SIZE,
  );

  return {
    seasonId,
    playerId: readString(searchParams?.player),
    teamSnapshotName: readString(searchParams?.team),
    status: readString(searchParams?.status),
    contributionKey: readString(searchParams?.type),
    dueDate: readString(searchParams?.dueDate),
    overdue: String(searchParams?.overdue || "") === "true",
    search: readString(searchParams?.search),
    sort: readString(searchParams?.sort) || "default",
    page: readPositiveInt(searchParams?.page, 1),
    pageSize: ALLOWED_PAGE_SIZES.includes(pageSizeCandidate)
      ? pageSizeCandidate
      : DEFAULT_PAGE_SIZE,
  };
}

export function applyContributionSearch(contributions = [], search = "") {
  const normalizedSearch = readString(search).toLowerCase();
  if (!normalizedSearch) return contributions;

  return (contributions || []).filter((contribution) => {
    const fields = [
      contribution.playerFirstName,
      contribution.playerLastName,
      contribution.playerDisplayName,
      contribution.title,
    ];

    return fields.some((field) =>
      String(field || "").toLowerCase().includes(normalizedSearch),
    );
  });
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), "de");
}

function compareDate(left, right) {
  return new Date(left || 0).getTime() - new Date(right || 0).getTime();
}

function compareNumberString(left, right) {
  return Number.parseFloat(left || "0") - Number.parseFloat(right || "0");
}

export function sortContributions(contributions = [], sort = "default") {
  const copy = [...(contributions || [])];

  if (sort === "player_name") {
    return copy.sort(
      (a, b) =>
        compareText(a.playerLastName, b.playerLastName) ||
        compareText(a.playerFirstName, b.playerFirstName),
    );
  }

  if (sort === "due_date") {
    return copy.sort((a, b) => compareDate(a.dueDate, b.dueDate));
  }

  if (sort === "status") {
    return copy.sort((a, b) => compareText(a.status, b.status));
  }

  if (sort === "amount_due") {
    return copy.sort((a, b) => compareNumberString(b.amountDue, a.amountDue));
  }

  if (sort === "amount_outstanding") {
    return copy.sort((a, b) =>
      compareNumberString(b.amountOutstanding, a.amountOutstanding),
    );
  }

  if (sort === "last_payment") {
    return copy.sort((a, b) => compareDate(b.lastPaymentAt, a.lastPaymentAt));
  }

  if (sort === "created_at") {
    return copy.sort((a, b) => compareDate(b.createdAt, a.createdAt));
  }

  return copy.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }

    return (
      compareDate(a.dueDate, b.dueDate) ||
      compareText(a.playerLastName, b.playerLastName) ||
      compareText(a.playerFirstName, b.playerFirstName)
    );
  });
}

export function paginateContributions(
  contributions = [],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const totalCount = contributions.length;
  const currentPage = Math.max(1, page);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: contributions.slice(start, end),
    pagination: {
      page: currentPage,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  };
}

export function buildContributionQueryString(
  currentSearchParams = {},
  patch = {},
) {
  const next = new URLSearchParams();
  const merged = {
    season: currentSearchParams.season || currentSearchParams.seasonId || "",
    player: currentSearchParams.player || currentSearchParams.playerId || "",
    team:
      currentSearchParams.team || currentSearchParams.teamSnapshotName || "",
    status: currentSearchParams.status || "",
    type:
      currentSearchParams.type || currentSearchParams.contributionKey || "",
    dueDate: currentSearchParams.dueDate || "",
    overdue: currentSearchParams.overdue || "",
    search: currentSearchParams.search || "",
    sort: currentSearchParams.sort || "",
    page: currentSearchParams.page || "",
    pageSize: currentSearchParams.pageSize || "",
    ...patch,
  };

  Object.entries(merged).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (normalized) next.set(key, normalized);
  });

  return next.toString();
}
