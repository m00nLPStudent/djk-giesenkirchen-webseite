import { escapeMailHtml } from "../mail.core.mjs";
import { normalizePublicSiteUrl } from "../../seo/publicSeo.core.mjs";

const CLUB_NAME = "DJK/VfL Giesenkirchen 05/09 e.V.";
export const CLUB_MAIL_LOGO_PATH = "/images/club-logo.png";
export const CLUB_MAIL_LOGO_ALT = "Logo der DJK/VfL Giesenkirchen 05/09 e.V.";

export function buildClubMailSiteUrls(siteUrl) {
  const origin = normalizePublicSiteUrl(siteUrl);
  return origin
    ? {
        logoUrl: `${origin}${CLUB_MAIL_LOGO_PATH}`,
        imprintUrl: `${origin}/impressum`,
        privacyUrl: `${origin}/datenschutz`,
      }
    : { logoUrl: null, imprintUrl: null, privacyUrl: null };
}

export function normalizeMailActionUrl(value) {
  try {
    const url = new URL(String(value || ""));
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function renderClubMailLayout({ title, paragraphs = [], action = null, siteUrl = null, signoff = true } = {}) {
  const safeTitle = escapeMailHtml(String(title || CLUB_NAME));
  const body = paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;color:#27272a;font-size:16px;line-height:1.6;">${escapeMailHtml(String(paragraph || ""))}</p>`)
    .join("");
  const actionUrl = action ? normalizeMailActionUrl(action.url) : null;
  const actionHtml = actionUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:#dc2626;"><a href="${escapeMailHtml(actionUrl)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">${escapeMailHtml(String(action.label || "Öffnen"))}</a></td></tr></table>`
    : "";
  const signoffHtml = signoff
    ? `<p style="margin:24px 0 0;color:#27272a;font-size:16px;line-height:1.6;">Sportliche Grüße<br><strong>${CLUB_NAME}</strong></p>`
    : "";
  const siteUrls = buildClubMailSiteUrls(siteUrl);
  const logoHtml = siteUrls.logoUrl
    ? `<img src="${escapeMailHtml(siteUrls.logoUrl)}" width="88" height="88" alt="${CLUB_MAIL_LOGO_ALT}" style="display:block;width:88px;height:88px;margin:0 auto 14px;object-fit:contain;border:0;outline:none;text-decoration:none;">`
    : "";
  const legalHtml = siteUrls.imprintUrl && siteUrls.privacyUrl
    ? `<p style="margin:10px 0 0;"><a href="${escapeMailHtml(siteUrls.imprintUrl)}" style="color:#fca5a5;text-decoration:underline;">Impressum</a><span aria-hidden="true"> · </span><a href="${escapeMailHtml(siteUrls.privacyUrl)}" style="color:#fca5a5;text-decoration:underline;">Datenschutz</a></p>`
    : "";

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"></head><body style="margin:0;padding:0;background:#f4f4f5;color:#18181b;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f5;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;"><tr><td align="center" style="padding:22px 24px;background:#18181b;border-bottom:4px solid #dc2626;">${logoHtml}<p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;line-height:1.4;">${CLUB_NAME}</p></td></tr><tr><td style="padding:28px 24px;"><h1 style="margin:0 0 20px;color:#18181b;font-size:24px;line-height:1.25;">${safeTitle}</h1>${body}${actionHtml}${signoffHtml}</td></tr><tr><td style="padding:18px 24px;background:#18181b;color:#d4d4d8;font-size:12px;line-height:1.5;"><strong style="color:#ffffff;">${CLUB_NAME}</strong><br>Diese Nachricht wurde automatisch durch das Vereinssystem versendet. Bitte antworte nur, wenn eine Antwortadresse angegeben ist.${legalHtml}</td></tr></table></td></tr></table></body></html>`;
}
