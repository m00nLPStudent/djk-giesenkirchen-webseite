import AdminLoginForm from "@/components/admin/auth/AdminLoginForm";
import {
  buildLoginRedirectTarget,
  normalizeAdminRedirectPath,
} from "@/lib/admin-auth/adminAuthRedirects";

export default async function AdminLoginPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const hasRedirectQuery =
    typeof resolvedSearchParams?.redirect === "string" &&
    resolvedSearchParams.redirect.trim().length > 0;
  const redirectTarget = buildLoginRedirectTarget(
    normalizeAdminRedirectPath(resolvedSearchParams?.redirect || ""),
  );
  const sessionExpired = resolvedSearchParams?.reason === "session-expired";

  return (
    <AdminLoginForm
      redirectTarget={redirectTarget}
      hasRedirectQuery={hasRedirectQuery}
      sessionExpiredNotice={sessionExpired}
    />
  );
}
