export function extractFootballDeWidgetId(widgetCode = "") {
  const value = String(widgetCode).trim();

  if (!value) return "";

  const dataIdMatch = value.match(/data-id=["']([^"']+)["']/i);
  if (dataIdMatch?.[1]) return dataIdMatch[1];

  const plainMatch = value.match(/^([a-f0-9-]{20,})$/i);
  if (plainMatch?.[1]) return plainMatch[1];

  return "";
}

export function extractFootballDeWidgetType(widgetCode = "") {
  const value = String(widgetCode).trim();

  if (!value) return "";

  const typeMatch = value.match(/data-type=["']([^"']+)["']/i);
  if (typeMatch?.[1]) return typeMatch[1];

  return "";
}

export function parseFootballDeWidgetCode(widgetCode = "") {
  return {
    widgetId: extractFootballDeWidgetId(widgetCode),
    widgetType: extractFootballDeWidgetType(widgetCode),
  };
}

const WIDGET_TYPES = {
  matches: "team-matches",
  table: "table",
};

export function validateFootballDeWidgetCode(widgetCode = "", kind = "") {
  const parsed = parseFootballDeWidgetCode(widgetCode);
  const expectedType = WIDGET_TYPES[kind];
  if (!expectedType || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(parsed.widgetId)) {
    return { data: null, error: { code: "INVALID_FOOTBALL_DE_WIDGET", message: "Der Widget-Code ist ungültig oder unvollständig." } };
  }
  if (parsed.widgetType !== expectedType) {
    return { data: null, error: { code: "INVALID_FOOTBALL_DE_WIDGET_TYPE", message: kind === "matches" ? "Bitte verwende einen Spielplan-Widget-Code vom Typ team-matches." : "Bitte verwende einen Tabellen-Widget-Code vom Typ table." } };
  }
  return { data: { widgetId: parsed.widgetId, widgetType: parsed.widgetType }, error: null };
}
