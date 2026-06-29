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
