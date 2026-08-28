import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { buildAdminRedirectUrl } from "./adminAuthRedirects";
import { normalizeLoginEmail } from "./adminUserEmailSync.core.mjs";
import { finalizeAdminUserEmailChange } from "./adminUserEmailSync.service";
import {
  executeAdminEmailChangeConfirmation,
  executeAdminEmailChangeRequest,
  inspectAdminEmailChangeToken,
} from "./adminEmailChange.core.mjs";
import { createMailIdempotencyKey } from "@/lib/mail/mail.core.mjs";
import { logMailFailure, sendMail } from "@/lib/mail/mail.service";
import {
  buildAdminEmailChangeConfirmationMail,
  buildAdminEmailChangeNewCompletionMail,
  buildAdminEmailChangeOldCompletionMail,
  buildAdminEmailChangeOldWarningMail,
} from "@/lib/mail/templates/adminEmailChange.mjs";

const PAGE_SIZE = 1000;
const REQUEST_FIELDS = "id, user_id, requested_by, old_email, new_email, status, expires_at, confirmed_at, completed_at, locked_at, compensation_started_at";
const sameTimestamp = (left, right) => Boolean(left && right) && Date.parse(left) === Date.parse(right);

async function listAllAuthUsers(client) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return { ok: false, users: [] };
    users.push(...(data?.users || []));
    if ((data?.users || []).length < PAGE_SIZE) return { ok: true, users };
  }
}

function safeFailure(reason = "unexpected-failure") {
  return {
    logManualReview(stage) {
      console.error("[admin-email-change] manual review required", {
        stage: String(stage || "compensation_failed").slice(0, 80),
      });
    },
    ok: false,
    reason,
    message: "Die E-Mail-Änderung konnte nicht sicher verarbeitet werden.",
    errors: { email: "Bitte versuche es später erneut." },
  };
}

function buildDependencies(client, mailer = sendMail) {
  const send = async ({ to, content, eventType, requestId, context }) => {
    const result = await mailer({
      to,
      ...content,
      idempotencyKey: createMailIdempotencyKey(eventType, requestId),
    });
    if (!result?.ok) logMailFailure(context, result);
    return result;
  };

  return {
    async loadAuthUser(userId) {
      const { data, error } = await client.auth.admin.getUserById(userId);
      return { ok: !error && Boolean(data?.user?.id), user: data?.user || null };
    },
    async loadProfile(userId) {
      const { data, error } = await client.from("admin_profiles").select("id, email, is_active").eq("id", userId).maybeSingle();
      return { ok: !error && Boolean(data?.id), profile: data || null };
    },
    async hasAuthEmailConflict(email, userId) {
      const result = await listAllAuthUsers(client);
      return result.ok
        ? { ok: true, conflict: result.users.some((user) => user?.id !== userId && normalizeLoginEmail(user?.email) === email) }
        : { ok: false, conflict: false };
    },
    async hasProfileEmailConflict(email, userId) {
      const { data, error } = await client.from("admin_profiles").select("id, email");
      return error
        ? { ok: false, conflict: false }
        : { ok: true, conflict: (data || []).some((profile) => profile?.id !== userId && normalizeLoginEmail(profile?.email) === email) };
    },
    async loadActiveRequest(userId) {
      const { data, error } = await client.from("admin_email_change_requests").select("id, status, expires_at").eq("user_id", userId).in("status", ["pending", "confirming", "compensating"]).maybeSingle();
      return { ok: !error, request: data || null };
    },
    async expireRequest(id, expiredAt) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "expired", expired_at: expiredAt }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
      return { ok: !error && Boolean(data?.id) };
    },
    async cancelRequest(id, cancelledAt) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "cancelled", cancelled_at: cancelledAt }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
      return { ok: !error && Boolean(data?.id) };
    },
    async createRequest(payload) {
      const { data, error } = await client.from("admin_email_change_requests").insert(payload).select("id").maybeSingle();
      return { ok: !error && Boolean(data?.id), request: data || null };
    },
    async findRequestByTokenHash(tokenHash) {
      const { data, error } = await client.from("admin_email_change_requests").select("status, expires_at").eq("token_hash", tokenHash).maybeSingle();
      return { ok: !error, request: data || null };
    },
    async claimRequest(tokenHash, timestamp) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "confirming", confirmed_at: timestamp, locked_at: timestamp }).eq("token_hash", tokenHash).eq("status", "pending").gt("expires_at", timestamp).select(REQUEST_FIELDS).maybeSingle();
      return { ok: !error && Boolean(data?.id), request: data || null };
    },
    async expireRequestByTokenHash(tokenHash, expiredAt) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "expired", expired_at: expiredAt }).eq("token_hash", tokenHash).eq("status", "pending").lte("expires_at", expiredAt).select("id").maybeSingle();
      return { ok: !error, expired: !error && Boolean(data?.id) };
    },
    async failRequest(id, failureCode) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "failed", locked_at: null, failure_code: String(failureCode || "workflow_failed").slice(0, 80) }).eq("id", id).in("status", ["pending", "confirming"]).select("id").maybeSingle();
      return { ok: !error && Boolean(data?.id) };
    },
    async completeRequest(id, completedAt) {
      const { data, error } = await client.from("admin_email_change_requests").update({ status: "completed", completed_at: completedAt, locked_at: null, failure_code: null }).eq("id", id).eq("status", "confirming").select("id").maybeSingle();
      if (!error && data?.id) return { ok: true };
      const { data: verified, error: verifyError } = await client.from("admin_email_change_requests").select("id, status").eq("id", id).maybeSingle();
      return { ok: !verifyError && verified?.id === id && verified?.status === "completed" };
    },
    async claimCompensation({ requestId, userId, oldEmail, newEmail, workflowTimestamp, compensationStartedAt, allowCompleted }) {
      const attempt = async (originStatus) => {
        const payload = {
          status: "compensating",
          compensation_started_at: compensationStartedAt,
          ...(originStatus === "completed" ? { locked_at: compensationStartedAt } : {}),
        };
        let query = client.from("admin_email_change_requests").update(payload)
          .eq("id", requestId).eq("user_id", userId)
          .eq("old_email", oldEmail).eq("new_email", newEmail)
          .eq("status", originStatus).eq("confirmed_at", workflowTimestamp);
        query = originStatus === "completed"
          ? query.eq("completed_at", workflowTimestamp)
          : query.is("completed_at", null);
        const { data, error } = await query.select(REQUEST_FIELDS).maybeSingle();
        if (error) return { ok: false, ambiguous: true };
        return { ok: Boolean(data?.id), request: data || null };
      };

      let claimed = await attempt("confirming");
      if (!claimed.ok && !claimed.ambiguous && allowCompleted) claimed = await attempt("completed");
      if (!claimed.ok || !claimed.request) return { ok: false };

      const { data: verified, error: verifyError } = await client.from("admin_email_change_requests")
        .select(REQUEST_FIELDS).eq("id", requestId).maybeSingle();
      const valid = !verifyError
        && verified?.id === requestId
        && verified?.user_id === userId
        && normalizeLoginEmail(verified?.old_email) === oldEmail
        && normalizeLoginEmail(verified?.new_email) === newEmail
        && verified?.status === "compensating"
        && sameTimestamp(verified?.confirmed_at, workflowTimestamp)
        && sameTimestamp(verified?.compensation_started_at, compensationStartedAt)
        && Boolean(verified?.locked_at);
      return { ok: valid, request: valid ? verified : null };
    },
    async reverseAuthEmail({ userId, expectedCurrentEmail, originalEmail }) {
      const before = await this.loadAuthUser(userId);
      if (!before?.ok || before.user?.id !== userId || normalizeLoginEmail(before.user?.email) !== expectedCurrentEmail) {
        return { ok: false };
      }
      const { data, error } = await client.auth.admin.updateUserById(userId, { email: originalEmail });
      if (error || data?.user?.id !== userId) return { ok: false };
      const verified = await this.loadAuthUser(userId);
      return {
        ok: Boolean(verified?.ok && verified.user?.id === userId && normalizeLoginEmail(verified.user?.email) === originalEmail),
      };
    },
    async finishCompensation(id, failureCode) {
      const code = ["email_sync_failed_compensated", "completion_state_failed_compensated", "compensation_failed"].includes(failureCode)
        ? failureCode
        : "compensation_failed";
      const { data, error } = await client.from("admin_email_change_requests")
        .update({ status: "failed", completed_at: null, locked_at: null, failure_code: code })
        .eq("id", id).eq("status", "compensating")
        .select("id, status, failure_code, compensation_started_at, completed_at, locked_at").maybeSingle();
      if (!error && data?.id && data.status === "failed" && data.failure_code === code
          && data.compensation_started_at && data.completed_at === null && data.locked_at === null) return { ok: true };
      const { data: verified, error: verifyError } = await client.from("admin_email_change_requests")
        .select("id, status, failure_code, compensation_started_at, completed_at, locked_at")
        .eq("id", id).maybeSingle();
      return { ok: !verifyError && verified?.id === id && verified?.status === "failed"
        && verified?.failure_code === code && Boolean(verified?.compensation_started_at)
        && verified?.completed_at === null && verified?.locked_at === null };
    },
    async validateRequester(userId) {
      const { data: profile, error: profileError } = await client.from("admin_profiles").select("id, is_active").eq("id", userId).maybeSingle();
      if (profileError || !profile?.id || profile.is_active === false) return { ok: false };
      const { data: links, error: linksError } = await client.from("admin_user_roles").select("role_id").eq("user_id", userId);
      if (linksError || !(links || []).length) return { ok: false };
      const roleIds = links.map((link) => link.role_id);
      const { data: roles, error: rolesError } = await client.from("admin_roles").select("id, key, is_active").in("id", roleIds);
      if (rolesError || !(roles || []).some((role) => role.key === "superadmin" && role.is_active !== false)) return { ok: false };
      const { data: rolePermissions, error: rolePermissionsError } = await client.from("admin_role_permissions").select("permission_id").in("role_id", roleIds);
      if (rolePermissionsError || !(rolePermissions || []).length) return { ok: false };
      const permissionIds = rolePermissions.map((entry) => entry.permission_id);
      const { data: permissions, error: permissionsError } = await client.from("admin_permissions").select("key").in("id", permissionIds);
      return { ok: !permissionsError && (permissions || []).some((permission) => permission.key === "users.edit") };
    },
    async finalizeEmailChange(input) {
      const result = await finalizeAdminUserEmailChange(input);
      if (result?.requiresManualReview) {
        console.error("[admin-email-change] manual review required", {
          reason: result.reason || "email_sync_failed",
        });
      }
      return result;
    },
    sendOldAddressWarning: ({ requestId, oldEmail }) => send({ to: oldEmail, content: buildAdminEmailChangeOldWarningMail(), eventType: "admin-email-change-requested-old", requestId, context: "admin_email_change_requested_old" }),
    sendNewAddressConfirmation: ({ requestId, newEmail, confirmationUrl }) => send({ to: newEmail, content: buildAdminEmailChangeConfirmationMail({ confirmationUrl }), eventType: "admin-email-change-confirmation", requestId, context: "admin_email_change_confirmation" }),
    sendOldAddressCompletion: ({ requestId, oldEmail }) => send({ to: oldEmail, content: buildAdminEmailChangeOldCompletionMail(), eventType: "admin-email-change-completed-old", requestId, context: "admin_email_change_completed_old" }),
    sendNewAddressCompletion: ({ requestId, newEmail }) => send({ to: newEmail, content: buildAdminEmailChangeNewCompletionMail(), eventType: "admin-email-change-completed-new", requestId, context: "admin_email_change_completed_new" }),
  };
}

export async function requestAdminEmailChange({ actorUserId, targetUserId, requestedEmail }) {
  const client = createSupabaseAdminClient();
  if (!client) return safeFailure("missing-service-role");
  const confirmationBaseUrl = buildAdminRedirectUrl("/auth/confirm-email-change");
  try {
    return await executeAdminEmailChangeRequest({ actorUserId, targetUserId, requestedEmail, confirmationBaseUrl, dependencies: buildDependencies(client) });
  } catch {
    return safeFailure();
  }
}

export async function inspectAdminEmailChange(token) {
  const client = createSupabaseAdminClient();
  if (!client) return { status: "invalid" };
  try {
    return await inspectAdminEmailChangeToken({ token, dependencies: buildDependencies(client) });
  } catch {
    return { status: "invalid" };
  }
}

export async function confirmAdminEmailChange(token) {
  const client = createSupabaseAdminClient();
  if (!client) return { ok: false, status: "invalid" };
  try {
    return await executeAdminEmailChangeConfirmation({ token, dependencies: buildDependencies(client) });
  } catch {
    return { ok: false, status: "failed", message: "Die E-Mail-Adresse konnte nicht sicher geändert werden." };
  }
}
