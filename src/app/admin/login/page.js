import AdminLoginForm from "@/components/admin/auth/AdminLoginForm";
import {
  buildLoginRedirectTarget,
  normalizeAdminRedirectPath,
} from "@/lib/admin-auth/adminAuthRedirects";

export default async function AdminLoginPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const redirectTarget = buildLoginRedirectTarget(
    normalizeAdminRedirectPath(resolvedSearchParams?.redirect || ""),
  );

  return <AdminLoginForm redirectTarget={redirectTarget} />;
}
