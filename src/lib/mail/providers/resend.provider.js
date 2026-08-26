import "server-only";

import { executeResendSend } from "./resend.provider.core.mjs";

export async function sendWithResend(message, { fetchImpl = fetch, config = {} } = {}) {
  return executeResendSend(message, {
    fetchImpl,
    apiKey: config.apiKey || process.env.RESEND_API_KEY || "",
    from: config.from || process.env.MAIL_FROM || "",
    replyTo: config.replyTo || process.env.MAIL_REPLY_TO || "",
    signal: AbortSignal.timeout(10000),
  });
}
