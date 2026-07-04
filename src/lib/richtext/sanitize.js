const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "br",
]);

const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

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

export function sanitizeRichTextHtml(input) {
  const source = typeof input === "string" ? input : "";

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

    result += escapeText(html.slice(lastIndex, match.index));
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

    if (tagName === "a") {
      const href = normalizeHref(extractHref(rawAttributes));

      if (href) {
        result += `<a href="${escapeAttribute(href)}" rel="noopener noreferrer">`;
      } else {
        result += "<a>";
      }
      continue;
    }

    result += `<${tagName}>`;
  }

  result += escapeText(html.slice(lastIndex));

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

  if (containsHtmlTags(input)) {
    return sanitizeRichTextHtml(input);
  }

  return plainTextToParagraphHtml(input);
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
