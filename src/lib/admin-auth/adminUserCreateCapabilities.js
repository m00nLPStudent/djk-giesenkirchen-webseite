export function getAdminUserCreateCapabilities() {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    return {
      serviceRoleEnabled: true,
      createFlowEnabled: true,
      missingConfig: [],
    };
  }

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const missingConfig = [];

  if (!hasServiceRole) missingConfig.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!hasUrl) missingConfig.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasAnonKey) missingConfig.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return {
    serviceRoleEnabled: hasServiceRole,
    createFlowEnabled: hasServiceRole && hasUrl && hasAnonKey,
    missingConfig,
  };
}
