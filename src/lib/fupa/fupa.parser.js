export function extractFupaWidgetId(widgetCode = "") {
  const value = String(widgetCode).trim();

  if (!value) return "";

  const rootMatch = value.match(/fp-widget_root-([A-Za-z0-9_-]+)/);
  if (rootMatch?.[1]) return rootMatch[1];

  const plainMatch = value.match(/^([A-Za-z0-9_-]{10,})$/);
  if (plainMatch?.[1]) return plainMatch[1];

  return "";
}

export function extractFupaClubUrl(widgetCode = "") {
  const value = String(widgetCode).trim();

  if (!value) return "";

  const hrefMatch = value.match(/href=["'](https?:\/\/www\.fupa\.net\/club\/[^"']+)["']/i);
  if (hrefMatch?.[1]) return hrefMatch[1];

  const urlMatch = value.match(/https?:\/\/www\.fupa\.net\/club\/[^\s"'<>]+/i);
  if (urlMatch?.[0]) return urlMatch[0];

  return "";
}

export function parseFupaWidgetCode(widgetCode = "") {
  return {
    widgetId: extractFupaWidgetId(widgetCode),
    clubUrl: extractFupaClubUrl(widgetCode),
  };
}
