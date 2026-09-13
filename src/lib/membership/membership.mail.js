import "server-only";

import { sendMail } from "../mail/mail.service";
import { markMembershipRequestMailSent } from "./membership.repository";
import { executeMembershipRequestConfirmation } from "./membershipMail.core.mjs";

export function sendMembershipRequestConfirmation(request, { client, mailer = sendMail } = {}) {
  return executeMembershipRequestConfirmation(request, {
    send: mailer,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    markSent: (requestId, sentAt) => markMembershipRequestMailSent(requestId, sentAt, client),
  });
}
