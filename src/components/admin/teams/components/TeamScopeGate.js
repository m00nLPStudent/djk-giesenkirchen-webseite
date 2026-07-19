"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import useTeamScope from "../useTeamScope";

export default function TeamScopeGate({
  children,
  team = null,
  requireCreateScope = false,
}) {
  const router = useRouter();
  const { isReady } = useAdminUiContext();
  const { canAccessTeamInScope, canReachTeamCreate } = useTeamScope();

  const hasAccess = requireCreateScope
    ? canReachTeamCreate
    : canAccessTeamInScope(team || {});

  useEffect(() => {
    if (!isReady) return;
    if (!hasAccess) {
      router.replace("/admin/unauthorized?reason=missing-team-scope");
    }
  }, [hasAccess, isReady, router]);

  if (!isReady || !hasAccess) {
    return null;
  }

  return children;
}
