const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "h1",
  "h4",
  "p",
  "strong",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "br",
  "s",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "hr",
  "img",
]);

const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];
const ALLOWED_FONT_SIZES = new Set([
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
]);

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeTextChunk(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/\u00a0/g, " ");
}

function decodeEditableEntities(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\u00a0/g, " ");
}

function normalizeHref(rawHref) {
  if (typeof rawHref !== "string") return null;

  const candidate = rawHref.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");

  if (!candidate) return null;

  try {
    const parsed = new URL(candidate, "https://example.com");

    if (!ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol)) {
      return null;
    }

    if (parsed.protocol === "mailto:") {
      return candidate.toLowerCase().startsWith("mailto:") ? candidate : null;
    }

    return candidate;
  } catch {
    return null;
  }
}

function extractHref(attributes) {
  if (!attributes) return null;

  const hrefMatch = attributes.match(
    /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/i,
  );

  if (!hrefMatch) return null;

  return hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || null;
}

function extractStyle(attributes) {
  if (!attributes) return null;

  const styleMatch = attributes.match(
    /style\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/i,
  );

  if (!styleMatch) return null;

  return styleMatch[1] || styleMatch[2] || styleMatch[3] || null;
}

function extractAttribute(attributes, name) {
  if (!attributes) return null;
  const match = attributes.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'\u0060=<>]+))`, "i"));
  return match ? match[1] || match[2] || match[3] || null : null;
}

function normalizeImageSource(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value, "https://example.com");
    return ["http:", "https:"].includes(parsed.protocol) ? value : null;
  } catch {
    return null;
  }
}

function normalizeColor(value) {
  const candidate = String(value || "").trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(candidate) ? candidate : null;
}

function normalizeSpanStyle(rawStyle) {
  if (typeof rawStyle !== "string") return null;

  const declarations = [];
  const fontSize = rawStyle.match(/font-size\s*:\s*([^;]+)/i)?.[1]?.trim().toLowerCase();
  const color = normalizeColor(rawStyle.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1]);
  const background = normalizeColor(rawStyle.match(/background-color\s*:\s*([^;]+)/i)?.[1]);
  if (ALLOWED_FONT_SIZES.has(fontSize)) declarations.push(`font-size: ${fontSize}`);
  if (color) declarations.push(`color: ${color}`);
  if (background) declarations.push(`background-color: ${background}`);
  return declarations.join("; ") || null;
}

export function sanitizeRichTextHtml(input) {
  const source = typeof input === "string" ? normalizeTextChunk(input) : "";

  if (!source) return "";

  const html = source.replace(/<!--[\s\S]*?-->/g, "");
  const tagRegex = /<\/?([a-z0-9]+)([^>]*)>/gi;

  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const [fullTag, rawName, rawAttributes = ""] = match;
    const tagName = rawName.toLowerCase();
    const isClosing = fullTag.startsWith("</");

    result += escapeText(
      normalizeTextChunk(html.slice(lastIndex, match.index)),
    );
    lastIndex = tagRegex.lastIndex;

    if (!ALLOWED_TAGS.has(tagName)) {
      continue;
    }

    if (isClosing) {
      if (tagName !== "br") {
        result += `</${tagName}>`;
      }
      continue;
    }

    if (tagName === "br") {
      result += "<br>";
      continue;
    }

    if (tagName === "hr") {
      result += "<hr>";
      continue;
    }

    if (tagName === "img") {
      const src = normalizeImageSource(extractAttribute(rawAttributes, "src"));
      if (!src) continue;
      const alt = extractAttribute(rawAttributes, "alt") || "";
      const title = extractAttribute(rawAttributes, "title");
      result += `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${title ? ` title="${escapeAttribute(title)}"` : ""}>`;
      continue;
    }

    if (tagName === "a") {
      const href = normalizeHref(extractHref(rawAttributes));

      if (href) {
        result += `<a href="${escapeAttribute(href)}" rel="noopener noreferrer">`;
      } else {
        result += "<a>";
      }
      continue;
    }

    if (tagName === "span") {
      const safeStyle = normalizeSpanStyle(extractStyle(rawAttributes));

      if (safeStyle) {
        result += `<span style="${escapeAttribute(safeStyle)}">`;
      } else {
        result += "<span>";
      }
      continue;
    }

    if (tagName === "td" || tagName === "th") {
      const colspan = extractAttribute(rawAttributes, "colspan");
      const rowspan = extractAttribute(rawAttributes, "rowspan");
      const safeColspan = /^\d{1,2}$/.test(colspan || "") ? ` colspan="${colspan}"` : "";
      const safeRowspan = /^\d{1,2}$/.test(rowspan || "") ? ` rowspan="${rowspan}"` : "";
      result += `<${tagName}${safeColspan}${safeRowspan}>`;
      continue;
    }

    result += `<${tagName}>`;
  }

  result += escapeText(normalizeTextChunk(html.slice(lastIndex)));

  return result;
}

export function containsHtmlTags(input) {
  if (typeof input !== "string") return false;
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

export function plainTextToParagraphHtml(input) {
  const text = typeof input === "string" ? input : "";
  const trimmed = text.trim();

  if (!trimmed) return "";

  const normalized = trimmed.replace(/\r\n?/g, "\n");
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      const lineSafe = escapeText(paragraph).replace(/\n/g, "<br>");
      return `<p>${lineSafe}</p>`;
    })
    .join("");
}

export function toEditableHtml(input) {
  if (typeof input !== "string" || !input.trim()) return "";

  const decoded = decodeEditableEntities(input);

  if (containsHtmlTags(decoded)) {
    return sanitizeRichTextHtml(decoded);
  }

  return plainTextToParagraphHtml(decoded);
}

export function stripHtmlToText(input) {
  const sanitized = sanitizeRichTextHtml(input || "");

  return sanitized
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function hasMeaningfulRichText(input) {
  return stripHtmlToText(input).length > 0;
}
