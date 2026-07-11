"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_REQUIRED_FOR_ADMIN } from "@/lib/admin-auth/adminAuthConfig";
import { AUTH_ENFORCEMENT_ENABLED } from "@/lib/admin-auth/adminPermissionConfig";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import { resolveAdminRouteGuardResult } from "@/lib/admin-auth/permissionGuards";

export default function AdminRouteGuard({ children, route, userContext }) {
  const pathname = usePathname();
  const router = useRouter();
  const [resolved, setResolved] = useState(false);
  const [result, setResult] = useState({ allow: true, reason: "initial" });

  useEffect(() => {
    async function evaluate() {
      if (!AUTH_REQUIRED_FOR_ADMIN) {
        setResult({ allow: true, reason: "auth-not-required" });
        setResolved(true);
        return;
      }

      const context = userContext || (await getCurrentAdminContext());
      const nextResult = resolveAdminRouteGuardResult({
        route: route || pathname || "/admin",
        userContext: context,
      });

      setResult(nextResult);
      setResolved(true);

      if (!nextResult.allow && nextResult.redirectTo) {
        router.replace(nextResult.redirectTo);
      }
    }

    evaluate();
  }, [pathname, route, router, userContext]);

  if (!AUTH_REQUIRED_FOR_ADMIN) {
    return children;
  }

  const isPublicAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/set-password" ||
    pathname === "/admin/unauthorized";

  if (isPublicAuthRoute) {
    return children;
  }

  if (!resolved) {
    return null;
  }

  if (result.allow) {
    return children;
  }

  return null;
}
