import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import {
  normalizeLoginEmail,
  synchronizeAdminUserEmail,
} from "./adminUserEmailSync.core.mjs";

const PAGE_SIZE = 1000;

async function listAllAuthUsers(client) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) return { ok: false, users: [] };
    const pageUsers = data?.users || [];
    users.push(...pageUsers);
    if (pageUsers.length < PAGE_SIZE) return { ok: true, users };
  }
}

function createDependencies(client) {
  return {
    async loadAuthUser(userId) {
      const { data, error } = await client.auth.admin.getUserById(userId);
      return { ok: !error && Boolean(data?.user), user: data?.user || null };
    },
    async loadProfile(userId) {
      const { data, error } = await client
        .from("admin_profiles")
        .select("id, email")
        .eq("id", userId)
        .maybeSingle();
      return { ok: !error && Boolean(data?.id), profile: data || null };
    },
    async hasAuthEmailConflict(email, userId) {
      const result = await listAllAuthUsers(client);
      if (!result.ok) return { ok: false, conflict: false };
      return {
        ok: true,
        conflict: result.users.some(
          (user) =>
            user?.id !== userId && normalizeLoginEmail(user?.email) === email,
        ),
      };
    },
    async hasProfileEmailConflict(email, userId) {
      const { data, error } = await client
        .from("admin_profiles")
        .select("id, email");
      if (error) return { ok: false, conflict: false };
      return {
        ok: true,
        conflict: (data || []).some(
          (profile) =>
            profile?.id !== userId &&
            normalizeLoginEmail(profile?.email) === email,
        ),
      };
    },
    async updateAuthEmail(userId, email) {
      const { data, error } = await client.auth.admin.updateUserById(userId, {
        email,
      });
      return { ok: !error && data?.user?.id === userId };
    },
    async updateProfileEmail(userId, email) {
      const { data, error } = await client
        .from("admin_profiles")
        .update({ email })
        .eq("id", userId)
        .select("id, email")
        .maybeSingle();
      return {
        ok:
          !error &&
          data?.id === userId &&
          normalizeLoginEmail(data?.email) === email,
      };
    },
  };
}

export async function finalizeAdminUserEmailChange({ targetUserId, requestedEmail }) {
  const client = createSupabaseAdminClient();
  if (!client) {
    return {
      ok: false,
      reason: "missing-service-role",
      message: "Die Login-E-Mail kann derzeit nicht geändert werden.",
      errors: { email: "Serverkonfiguration ist unvollständig." },
    };
  }

  try {
    return await synchronizeAdminUserEmail({
      targetUserId,
      requestedEmail,
      dependencies: createDependencies(client),
    });
  } catch {
    return {
      ok: false,
      reason: "unexpected-failure",
      message: "Die Login-E-Mail konnte nicht sicher geändert werden.",
      errors: {
        email: "Die Änderung konnte nicht abgeschlossen werden.",
      },
    };
  }
}
