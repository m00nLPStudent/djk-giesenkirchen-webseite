function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function buildEmptyLookupResult() {
  return {
    ok: false,
    authUserPresent: false,
    profileFound: false,
    lookupType: null,
    fallbackUsed: false,
    queryError: null,
    profile: null,
  };
}

export async function resolveAdminProfileForAuthUser(
  client,
  user,
  { fields = "id, full_name, email, is_active, created_at, updated_at" } = {},
) {
  if (!client || !user?.id) {
    return buildEmptyLookupResult();
  }

  const normalizedEmail = normalizeEmail(user.email);

  const byId = await client
    .from("admin_profiles")
    .select(fields)
    .eq("id", user.id)
    .maybeSingle();

  if (byId?.error) {
    return {
      ok: false,
      authUserPresent: true,
      profileFound: false,
      lookupType: "id",
      fallbackUsed: Boolean(normalizedEmail),
      queryError: byId.error,
      profile: null,
    };
  }

  if (byId?.data) {
    return {
      ok: true,
      authUserPresent: true,
      profileFound: true,
      lookupType: "id",
      fallbackUsed: false,
      queryError: null,
      profile: byId.data,
    };
  }

  if (!normalizedEmail) {
    return {
      ok: true,
      authUserPresent: true,
      profileFound: false,
      lookupType: "id",
      fallbackUsed: false,
      queryError: null,
      profile: null,
    };
  }

  const byEmail = await client
    .from("admin_profiles")
    .select(fields)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (byEmail?.error) {
    return {
      ok: false,
      authUserPresent: true,
      profileFound: false,
      lookupType: "email",
      fallbackUsed: true,
      queryError: byEmail.error,
      profile: null,
    };
  }

  return {
    ok: true,
    authUserPresent: true,
    profileFound: Boolean(byEmail?.data),
    lookupType: "email",
    fallbackUsed: true,
    queryError: null,
    profile: byEmail?.data || null,
  };
}