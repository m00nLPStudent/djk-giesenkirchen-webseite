"use client";

import Link from "next/link";
import Can from "@/components/admin/auth/Can";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import useTeamScope from "../useTeamScope";

export default function TeamCreateButton({
  className = "",
  label = "Neue Mannschaft",
  href = "/admin/teams/new",
}) {
  const { isReady } = useAdminUiContext();
  const { canReachTeamCreate } = useTeamScope();

  if (!isReady) return null;
  if (!canReachTeamCreate) return null;

  return (
    <Can permission="teams.create" uiOnly>
      <Link href={href} className={className}>
        {label}
      </Link>
    </Can>
  );
}
