import "server-only";

import { sendMail } from "@/lib/mail/mail.service";
import * as defaultStore from "./notificationEmailDelivery.repository";
import { executeNotificationEmailDelivery } from "./notificationEmailDelivery.core.mjs";

const result = (status, extra = {}) => ({ ok: status === "sent" || status === "skipped" || status === "already_sent", status, ...extra });

export async function deliverNotificationEmail(notification, {
  db,
  mailer = sendMail,
  store = defaultStore,
  now = () => new Date(),
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "",
  providerName = process.env.MAIL_PROVIDER || "",
} = {}) {
  return executeNotificationEmailDelivery(notification, { db, mailer, store, now, siteUrl, providerName });
}

export async function deliverPersistedNotificationEmailsBestEffort(notifications, options = {}) {
  const settled = await Promise.allSettled((notifications || []).map((notification) => deliverNotificationEmail(notification, options)));
  for (const item of settled) {
    if (item.status === "rejected" || (item.value?.status === "failed" && item.value?.code)) {
      console.error("[notification-email-delivery]", { status: "failed", code: item.status === "rejected" ? "notification_email_unexpected" : item.value.code });
    }
  }
  return settled.map((item) => item.status === "fulfilled" ? item.value : result("failed", { code: "notification_email_unexpected" }));
}
