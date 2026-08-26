import "server-only";

import { safeMailFailure, validateMailMessage } from "./mail.core.mjs";
import { resolveMailProvider } from "./mail.provider";

export async function sendMail(message, { provider = resolveMailProvider() } = {}) {
  const validated = validateMailMessage(message);
  if (validated.error) return safeMailFailure(validated.error.code);
  try {
    return await provider(validated.data);
  } catch {
    return safeMailFailure("mail_provider_failed");
  }
}

export function logMailFailure(context, result) {
  if (result?.ok || result?.status === "sent") return;
  console.error("[transactional-mail]", {
    context: String(context || "unknown"),
    status: result?.status || "failed",
    code: result?.error?.code || "mail_delivery_failed",
  });
}
