import "server-only";

import { sendWithResend } from "./providers/resend.provider";

export function resolveMailProvider(providerName = process.env.MAIL_PROVIDER || "") {
  const provider = String(providerName).trim().toLowerCase();
  if (provider === "resend") return sendWithResend;
  return async () => ({ ok: false, status: "skipped", error: { code: provider ? "mail_provider_unsupported" : "mail_provider_not_configured", message: "Mailprovider ist nicht konfiguriert." } });
}
