export const RESULT_TICKER_CONTEXTS = Object.freeze({
  MIXED: "mixed",
  FOOTBALL: "football",
  TABLE_TENNIS: "table-tennis",
  HIDDEN: "hidden",
});

export function resolveResultsTickerRouteContext(pathname = "/") {
  const path = typeof pathname === "string" ? pathname.split(/[?#]/, 1)[0] || "/" : "/";
  if (path === "/damen-gymnastik" || path.startsWith("/damen-gymnastik/")) return RESULT_TICKER_CONTEXTS.HIDDEN;
  if (path === "/behindertensport" || path.startsWith("/behindertensport/")) return RESULT_TICKER_CONTEXTS.HIDDEN;
  if (path === "/fussball" || path.startsWith("/fussball/")) return RESULT_TICKER_CONTEXTS.FOOTBALL;
  if (path === "/tischtennis" || path.startsWith("/tischtennis/")) return RESULT_TICKER_CONTEXTS.TABLE_TENNIS;
  return RESULT_TICKER_CONTEXTS.MIXED;
}

export function filterResultsForRouteContext(results = [], context) {
  if (context === RESULT_TICKER_CONTEXTS.HIDDEN) return [];
  if (context === RESULT_TICKER_CONTEXTS.FOOTBALL) return results.filter((item) => item.departmentSlug === "fussball");
  if (context === RESULT_TICKER_CONTEXTS.TABLE_TENNIS) return results.filter((item) => item.departmentSlug === "tischtennis");
  return results.filter((item) => ["fussball", "tischtennis"].includes(item.departmentSlug));
}
