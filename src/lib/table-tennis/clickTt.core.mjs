export const CLICK_TT_ORIGIN = "https://www.mytischtennis.de";
export const CLICK_TT_PROVIDER = "click_tt";

const LIMITS = { association: 16, season: 6, id: 20, slug: 160 };

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeClickTtConfig(input = {}) {
  const data = {
    provider: CLICK_TT_PROVIDER,
    association: clean(input.association).toUpperCase(),
    external_season_key: clean(input.external_season_key),
    external_group_id: clean(input.external_group_id),
    league_slug: clean(input.league_slug),
    external_team_id: clean(input.external_team_id),
    is_active: input.is_active !== false,
  };
  const valid = /^[A-Z0-9_-]{2,16}$/.test(data.association)
    && /^\d{2}--\d{2}$/.test(data.external_season_key)
    && /^\d{1,20}$/.test(data.external_group_id)
    && /^\d{1,20}$/.test(data.external_team_id)
    && data.league_slug.length > 0 && data.league_slug.length <= LIMITS.slug
    && !/[\s/?#\\\u0000-\u001f\u007f]/.test(data.league_slug);
  return valid ? { data, error: null } : { data: null, error: { code: "INVALID_CLICK_TT_CONFIG", message: "Die click-TT-Konfiguration ist unvollstaendig oder ungueltig." } };
}

export function buildClickTtUrl(input, view = "tabelle", phase = "gesamt") {
  const normalized = normalizeClickTtConfig(input);
  if (normalized.error || !["tabelle", "spielplan"].includes(view) || !["gesamt", "vr", "rr"].includes(phase)) return null;
  const c = normalized.data;
  return `${CLICK_TT_ORIGIN}/click-tt/${encodeURIComponent(c.association)}/${encodeURIComponent(c.external_season_key)}/ligen/${encodeURIComponent(c.league_slug)}/gruppe/${encodeURIComponent(c.external_group_id)}/${view}/${phase}`;
}

function valuesByKey(value, keys, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) return value.reduce((all, item) => valuesByKey(item, keys, all), output);
  for (const [key, child] of Object.entries(value)) {
    if (keys.includes(key)) output.push(child);
    valuesByKey(child, keys, output);
  }
  return output;
}

function meetingRows(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) { value.forEach((item) => meetingRows(item, output)); return output; }
  if (value.meeting_id !== undefined || value.meetingId !== undefined) output.push(value);
  else Object.values(value).forEach((item) => meetingRows(item, output));
  return output;
}

function hydrationValues(html) {
  const values = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { values.push(JSON.parse(match[1])); } catch { /* malformed provider payload */ }
  }
  for (const match of html.matchAll(/streamController\.enqueue\(("(?:\\.|[^"\\])*")\)/g)) {
    try { values.push(JSON.parse(match[1])); } catch { /* malformed provider payload */ }
  }
  const decoded = values.filter((value) => typeof value === "string").join("\n");
  for (const source of [html, decoded]) for (const key of ["league_table", "meetings_excerpt", "meetings"]) {
    let from = 0;
    while (from < source.length) {
      const keyIndex = source.indexOf(`"${key}"`, from);
      if (keyIndex < 0) break;
      const start = source.indexOf("[", keyIndex + key.length + 2);
      if (start < 0) break;
      let depth = 0; let quoted = false; let escaped = false; let end = -1;
      for (let index = start; index < source.length; index += 1) {
        const character = source[index];
        if (quoted) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') quoted = false; continue; }
        if (character === '"') quoted = true;
        else if (character === "[") depth += 1;
        else if (character === "]" && --depth === 0) { end = index + 1; break; }
      }
      if (end > start) { try { values.push({ [key]: JSON.parse(source.slice(start, end)) }); } catch { /* fail closed later */ } }
      from = Math.max(keyIndex + key.length + 2, end);
    }
  }
  return values;
}

function asNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function asText(value) { return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, 240) : ""; }
function pick(row, ...keys) { for (const key of keys) { const value = key.split(".").reduce((item, part) => item?.[part], row); if (value !== undefined && value !== null) return value; } return null; }
function ratio(row, relationKey, wonKey, lostKey) { const relation = asText(row?.[relationKey]); if (relation) return relation; const won = asText(row?.[wonKey]); const lost = asText(row?.[lostKey]); return won && lost ? `${won}:${lost}` : won; }

const CLICK_TT_TIME_ZONE = "Europe/Berlin";
const clickTtDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLICK_TT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function normalizeClickTtDateTime(value, fallbackTime = "") {
  const raw = asText(value);
  if (!raw) return { date: "", time: asText(fallbackTime) };
  const hasExplicitOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const parsed = hasExplicitOffset ? new Date(raw) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) {
    const parts = Object.fromEntries(
      clickTtDateTimeFormatter
        .formatToParts(parsed)
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    };
  }
  return {
    date: /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "",
    time: raw.includes("T") ? raw.slice(11, 16) : asText(fallbackTime),
  };
}

function asBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeMeetingResult(row) {
  const explicitResult = asText(pick(row, "result", "meeting_result", "result_text"));
  if (explicitResult) return explicitResult;
  const state = asText(pick(row, "state", "status")).toLowerCase();
  const completed = asBoolean(pick(row, "is_meeting_complete", "isMeetingComplete")) || state === "done";
  if (!completed) return "";
  const homeScore = asText(pick(row, "matches_won", "home_matches_won", "homeScore"));
  const awayScore = asText(pick(row, "matches_lost", "away_matches_won", "awayScore"));
  return homeScore && awayScore ? `${homeScore}:${awayScore}` : "";
}

function normalizeMeetingStatus(row, result) {
  if (result) return "";
  const state = asText(pick(row, "state", "status")).toLowerCase();
  if (state === "scheduled") return "Geplant";
  if (state === "done" || asBoolean(pick(row, "is_meeting_complete", "isMeetingComplete"))) return "Abgeschlossen";
  return "";
}

function normalizeMeetingVenue(row) {
  const hallNumber = asText(pick(row, "hall_number", "hallNumber"));
  if (hallNumber) return /^halle\b/i.test(hallNumber) ? hallNumber : `Halle ${hallNumber}`;
  return asText(pick(row, "venue", "location.label"));
}

export function parseClickTtTable(html, externalTeamId) {
  const candidates = hydrationValues(html).flatMap((value) => valuesByKey(value, ["league_table", "leagueTable"]));
  const rows = candidates.filter(Array.isArray).find((items) => items.length > 0);
  if (!rows) return { data: null, error: { code: "CLICK_TT_TABLE_MISSING" } };
  const data = rows.map((row) => ({
    rank: asNumber(pick(row, "table_rank", "rank")), teamName: asText(pick(row, "team_name", "teamName")),
    matchesPlayed: asNumber(pick(row, "meetings_count", "matchesPlayed")), wins: asNumber(pick(row, "meetings_won", "wins")),
    draws: asNumber(pick(row, "meetings_tie", "draws")), losses: asNumber(pick(row, "meetings_lost", "losses")),
    score: ratio(row, "matches_relation", "matches_won", "matches_lost") || asText(row?.score), sets: ratio(row, "sets_relation", "sets_won", "sets_lost") || asText(row?.sets),
    difference: ratio(row, "games_relation", "games_won", "games_lost") || asText(row?.difference), points: ratio(row, "points_relation", "points_won", "points_lost") || asText(row?.points),
    isOwnTeam: asText(pick(row, "team_id", "teamId")) === String(externalTeamId),
  })).filter((row) => row.teamName);
  return data.length ? { data, error: null } : { data: null, error: { code: "CLICK_TT_TABLE_INVALID" } };
}

export function parseClickTtSchedule(html, externalTeamId) {
  const candidates = hydrationValues(html).flatMap((value) => valuesByKey(value, ["meetings_excerpt", "meetings", "schedule"]));
  const rows = candidates.filter(Array.isArray).flatMap((items) => meetingRows(items));
  if (!rows.length) return { data: null, error: { code: "CLICK_TT_SCHEDULE_MISSING" } };
  const id = String(externalTeamId);
  const normalizedRows = rows.map((row) => {
    const homeId = asText(pick(row, "team_home_id", "home_team_id", "homeTeamId", "team_home.team_id", "team_home.id", "home_team.team_id", "home_team.id"));
    const awayId = asText(pick(row, "team_away_id", "away_team_id", "awayTeamId", "team_away.team_id", "team_away.id", "away_team.team_id", "away_team.id"));
    const dateTime = asText(pick(row, "date", "start_at", "startAt"));
    const start = normalizeClickTtDateTime(dateTime, pick(row, "time"));
    const result = normalizeMeetingResult(row);
    return {
      meetingId: asText(pick(row, "meeting_id", "meetingId", "id")), date: start.date,
      time: start.time,
      homeTeam: asText(pick(row, "team_home.team_name", "team_home.name", "home_team.team_name", "home_team.name", "homeTeam", "team_home_name", "team_home")),
      awayTeam: asText(pick(row, "team_away.team_name", "team_away.name", "away_team.team_name", "away_team.name", "awayTeam", "team_away_name", "team_away")),
      result, status: normalizeMeetingStatus(row, result),
      venue: normalizeMeetingVenue(row), isHome: homeId === id, isAway: awayId === id,
    };
  }).filter((row) => row.isHome || row.isAway);
  const data = [...new Map(normalizedRows.map((row) => [row.meetingId || `${row.date}/${row.time}/${row.homeTeam}/${row.awayTeam}`, row])).values()]
    .sort((left, right) => {
      const leftStart = left.date ? `${left.date}T${left.time || "99:99"}` : "9999-99-99T99:99";
      const rightStart = right.date ? `${right.date}T${right.time || "99:99"}` : "9999-99-99T99:99";
      return leftStart.localeCompare(rightStart) || left.meetingId.localeCompare(right.meetingId);
    });
  return { data, error: null };
}
