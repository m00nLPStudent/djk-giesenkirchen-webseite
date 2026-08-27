export const AUTH_MAIL_RATE_LIMIT_MESSAGE =
  "Es wurden in kurzer Zeit zu viele E-Mails angefordert. Bitte warte etwas und versuche es später erneut.";

export function isAuthMailRateLimitError(error) {
  const code = String(error?.code || "").trim().toLowerCase();
  const message = String(error?.message || error?.error_description || "").trim().toLowerCase();
  return code === "over_email_send_rate_limit" || message.includes("email rate limit exceeded");
}

export function getAuthMailErrorMessage(error, fallback) {
  return isAuthMailRateLimitError(error) ? AUTH_MAIL_RATE_LIMIT_MESSAGE : fallback;
}
