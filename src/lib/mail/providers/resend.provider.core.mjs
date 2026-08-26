import { safeMailFailure } from "../mail.core.mjs";

export const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

export async function executeResendSend(message, { fetchImpl, apiKey = "", from = "", replyTo = "", signal } = {}) {
  if (!apiKey || !from) return { ok: false, status: "skipped", error: { code: "mail_provider_not_configured", message: "Mailprovider ist nicht konfiguriert." } };
  try {
    const response = await fetchImpl(RESEND_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": message.idempotencyKey },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) return safeMailFailure(`provider_http_${response.status}`);
    const data = await response.json().catch(() => ({}));
    return { ok: true, status: "sent", providerMessageId: data?.id || null, error: null };
  } catch {
    return safeMailFailure("provider_request_failed");
  }
}
