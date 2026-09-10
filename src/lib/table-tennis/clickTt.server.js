import "server-only";
import { buildClickTtUrl, parseClickTtSchedule, parseClickTtTable } from "./clickTt.core.mjs";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;

async function fetchHtml(url, fetchImpl = fetch) {
  if (!url) return { data: null, error: { code: "INVALID_CLICK_TT_URL" } };
  try {
    const response = await fetchImpl(url, { headers: { Accept: "text/html", "User-Agent": "DJK-VfL-Giesenkirchen/1.0 competition-data" }, signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 900 } });
    if (!response.ok) return { data: null, error: { code: `CLICK_TT_HTTP_${response.status}` } };
    const length = Number(response.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_BYTES) return { data: null, error: { code: "CLICK_TT_RESPONSE_TOO_LARGE" } };
    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > MAX_BYTES) return { data: null, error: { code: "CLICK_TT_RESPONSE_TOO_LARGE" } };
    return { data: html, error: null };
  } catch (error) {
    return { data: null, error: { code: error?.name === "TimeoutError" ? "CLICK_TT_TIMEOUT" : "CLICK_TT_UNAVAILABLE" } };
  }
}

export async function loadClickTtCompetition(config, { fetchImpl } = {}) {
  if (!config?.is_active) return { status: "inactive", table: null, schedule: null, attribution: null, error: null };
  const tableUrl = buildClickTtUrl(config, "tabelle");
  const scheduleUrl = buildClickTtUrl(config, "spielplan");
  const [tableResponse, scheduleResponse] = await Promise.all([fetchHtml(tableUrl, fetchImpl), fetchHtml(scheduleUrl, fetchImpl)]);
  const table = tableResponse.error ? tableResponse : parseClickTtTable(tableResponse.data, config.external_team_id);
  const schedule = scheduleResponse.error ? scheduleResponse : parseClickTtSchedule(scheduleResponse.data, config.external_team_id);
  const availableParts = Number(!table.error) + Number(!schedule.error);
  return {
    status: availableParts === 2 ? "available" : availableParts === 1 ? "partial" : "unavailable",
    table: table.error ? null : table.data,
    schedule: schedule.error ? null : schedule.data,
    tableError: table.error || null,
    scheduleError: schedule.error || null,
    attribution: { label: "myTischtennis / click-TT", sourceUrl: tableUrl },
    error: availableParts ? null : table.error || schedule.error,
  };
}
