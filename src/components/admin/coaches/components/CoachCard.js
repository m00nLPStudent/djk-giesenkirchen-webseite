import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CoachAvatar from "./CoachAvatar";
import CoachStatusBadge from "./CoachStatusBadge";

export default function CoachCard({ coach }) {
  const teams = coach.teamNames?.length ? coach.teamNames.join(", ") : "Keine Mannschaft";
  const href = coach._canEditInScope === false
    ? `/trainer/${coach.slug}`
    : `/admin/coaches/edit/${coach.id}`;
  return (
    <Link href={href} aria-label={`Details zu ${coach.displayName} öffnen`} className="block rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-red-500/40 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 lg:hidden">
      <div className="flex items-start gap-3">
        <CoachAvatar coach={coach} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="truncate font-black text-white">{coach.displayName}</p><p className="mt-1 truncate text-sm text-white/55">{coach.primaryRoleLabel || "Trainer"}</p></div>
            <ChevronRight size={18} className="mt-1 shrink-0 text-white/35" aria-hidden="true" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><CoachStatusBadge active={coach.isActive} /><span className="min-w-0 truncate text-sm text-white/60">{teams}</span></div>
        </div>
      </div>
    </Link>
  );
}
