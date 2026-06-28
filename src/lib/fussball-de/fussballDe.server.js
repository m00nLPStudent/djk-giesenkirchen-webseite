function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToLines(html = "") {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split(/\n|\s{3,}/)
    .map((line) => decodeHtml(line))
    .filter(Boolean);
}

function uniqueByKey(items = [], getKey) {
  const map = new Map();

  items.forEach((item) => {
    const key = getKey(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });

  return Array.from(map.values());
}

function parseMatchesFromLines(lines = []) {
  const datePattern = /(\d{1,2}\.\d{1,2}\.\d{2,4})/;
  const timePattern = /(\d{1,2}:\d{2})/;
  const scorePattern = /(\d{1,2})\s*[:|-]\s*(\d{1,2})/;
  const matches = [];

  lines.forEach((line, index) => {
    const hasDate = datePattern.test(line);
    const hasScore = scorePattern.test(line);
    const hasTime = timePattern.test(line);

    if (!hasDate && !hasScore && !hasTime) return;

    const windowText = [
      lines[index - 3],
      lines[index - 2],
      lines[index - 1],
      line,
      lines[index + 1],
      lines[index + 2],
      lines[index + 3],
    ]
      .filter(Boolean)
      .join(" · ");

    const teams = windowText
      .split(" · ")
      .map((item) => decodeHtml(item))
      .filter((item) => item.length > 2)
      .filter((item) => !datePattern.test(item))
      .filter((item) => !timePattern.test(item))
      .filter((item) => !/^\d+$/.test(item));

    matches.push({
      date: windowText.match(datePattern)?.[1] || "",
      time: windowText.match(timePattern)?.[1] || "",
      score: windowText.match(scorePattern)?.[0] || "",
      homeTeam: teams[0] || "",
      awayTeam: teams[1] || "",
      raw: windowText,
    });
  });

  return uniqueByKey(matches, (match) => match.raw).slice(0, 8);
}

function parseTableFromLines(lines = []) {
  const rows = [];

  lines.forEach((line) => {
    const normalized = decodeHtml(line);
    const match = normalized.match(/^(\d{1,2})\.?\s+(.+?)\s+(\d{1,2})\s+(\d{1,3})\s*[:|-]\s*(\d{1,3})\s+(\d{1,3})$/);

    if (!match) return;

    rows.push({
      position: match[1],
      team: match[2],
      games: match[3],
      goalsFor: match[4],
      goalsAgainst: match[5],
      points: match[6],
    });
  });

  return uniqueByKey(rows, (row) => `${row.position}-${row.team}`).slice(0, 18);
}

function pickRelevantMatches(matches = []) {
  if (matches.length <= 4) return matches;

  const now = new Date();
  const withDates = matches.map((match) => {
    const [day, month, year] = String(match.date || "").split(".");
    const fullYear = year?.length === 2 ? `20${year}` : year;
    const date = day && month && fullYear ? new Date(`${fullYear}-${month}-${day}`) : null;

    return { ...match, parsedDate: date };
  });

  const past = withDates
    .filter((match) => match.parsedDate && match.parsedDate < now)
    .sort((a, b) => b.parsedDate - a.parsedDate)
    .slice(0, 1);

  const future = withDates
    .filter((match) => !match.parsedDate || match.parsedDate >= now)
    .sort((a, b) => (a.parsedDate || now) - (b.parsedDate || now))
    .slice(0, 3);

  return [...past, ...future].map(({ parsedDate, ...match }) => match);
}

export async function fetchFussballDeCompetitionData(sourceUrl, { includeTable = true } = {}) {
  if (!sourceUrl) {
    return {
      matches: [],
      table: [],
      sourceUrl: "",
      error: "Kein fussball.de-Link hinterlegt.",
    };
  }

  try {
    const response = await fetch(sourceUrl, {
      next: { revalidate: 60 * 60 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DJKGiesenkirchenWebsite/1.0; +https://djk-giesenkirchen.de)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        matches: [],
        table: [],
        sourceUrl,
        error: `fussball.de konnte nicht geladen werden (${response.status}).`,
      };
    }

    const html = await response.text();
    const lines = htmlToLines(html);
    const matches = pickRelevantMatches(parseMatchesFromLines(lines));
    const table = includeTable ? parseTableFromLines(lines) : [];

    return {
      matches,
      table,
      sourceUrl,
      error: matches.length || table.length ? "" : "Es konnten noch keine strukturierten Daten erkannt werden.",
    };
  } catch (error) {
    return {
      matches: [],
      table: [],
      sourceUrl,
      error: error.message || "fussball.de konnte nicht abgerufen werden.",
    };
  }
}
