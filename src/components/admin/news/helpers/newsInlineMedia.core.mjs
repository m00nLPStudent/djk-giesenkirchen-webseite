const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMG = /<img\b[^>]*>/gi;
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"))?.slice(1).find((value) => value !== undefined) || null;
const escapeAttribute = (value) => String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function extractNewsInlineMediaAssetIds(html = "") {
  const ids = [];
  for (const tag of String(html).match(IMG) || []) {
    const id = attribute(tag, "data-media-asset-id");
    if (id && UUID.test(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function hasInvalidNewsInlineMediaAssetIds(html = "") {
  return (String(html).match(IMG) || []).some((tag) => {
    const id = attribute(tag, "data-media-asset-id");
    return id !== null && !UUID.test(id);
  });
}

export function extractTransientImageSources(html = "") {
  return (String(html).match(IMG) || []).map((tag) => attribute(tag, "src")).filter((src) => /^(?:blob:|data:image\/)/i.test(src || ""));
}

export function hasNewTransientImageSources(nextHtml, previousHtml = "") {
  const previous = new Set(extractTransientImageSources(previousHtml));
  return extractTransientImageSources(nextHtml).some((src) => !previous.has(src));
}

export function rewriteCentralMediaImageSources(html = "", urlById = new Map()) {
  return String(html).replace(IMG, (tag) => {
    const id = attribute(tag, "data-media-asset-id");
    const url = id && urlById.get(id);
    if (!url) return tag;
    const safeUrl = escapeAttribute(url);
    return /\bsrc\s*=/i.test(tag)
      ? tag.replace(/\bsrc\s*=\s*(?:"[^"]*"|'[^']*')/i, `src="${safeUrl}"`)
      : tag.replace(/\s*\/>$/, (ending) => ` src="${safeUrl}"${ending}`);
  });
}

export function createCentralMediaImageHtml(item = {}) {
  if (!UUID.test(item.id || "") || !/^https?:\/\//i.test(item.previewUrl || "")) return null;
  return `<img src="${escapeAttribute(item.previewUrl)}" data-media-asset-id="${item.id}" class="news-inline-image--standard" alt="${escapeAttribute(item.alt_text || "")}">`;
}
