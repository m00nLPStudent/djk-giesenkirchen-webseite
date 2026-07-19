"use client";

import { useMemo } from "react";
import useAdminScope from "@/components/admin/auth/useAdminScope";
import {
  canAccessTeamInScope,
  canCreateTeamInScope,
  canReachTeamCreate,
  filterTeamsByScope,
  hasTeamManagementScope,
} from "./teamScope";

export default function useTeamScope(teams = []) {
  const scopeContext = useAdminScope();

  const scopedTeams = useMemo(
    () => filterTeamsByScope(scopeContext, teams),
    [scopeContext, teams],
  );

  return {
    scopeContext,
    scopedTeams,
    hasTeamManagementScope: hasTeamManagementScope(scopeContext),
    canReachTeamCreate: canReachTeamCreate(scopeContext),
    canCreateTeamInScope: (team) => canCreateTeamInScope(scopeContext, team),
    canAccessTeamInScope: (team) => canAccessTeamInScope(scopeContext, team),
  };
}
