import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AdminCard from "@/components/admin/common/AdminCard";
import CoachCard from "./components/CoachCard";
import CoachAvatar from "./components/CoachAvatar";
import CoachEmptyState from "./components/CoachEmptyState";
import CoachStatusBadge from "./components/CoachStatusBadge";

function teamLabel(coach) {
  return coach.teamNames?.length ? coach.teamNames.join(", ") : "Keine Mannschaft";
}

function coachHref(coach) {
  return coach._canEditInScope === false
    ? `/trainer/${coach.slug}`
    : `/admin/coaches/edit/${coach.id}`;
}

export default function AdminCoachesList({ coaches = [] }) {
  if (!coaches.length) return <CoachEmptyState />;
  return (
    <div className="space-y-3">
      {coaches.map((coach) => <CoachCard key={`${coach.id}-mobile`} coach={coach} />)}
      <AdminCard className="hidden overflow-hidden lg:block">
        <div className="grid grid-cols-[3.5rem_minmax(10rem,1.25fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_7rem_4rem] gap-4 border-b border-white/10 px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">
          <span>Profil</span><span>Name</span><span>Rolle</span><span>Mannschaft(en)</span><span>Status</span><span className="text-right">Details</span>
        </div>
        {coaches.map((coach) => (
          <Link key={coach.id} href={coachHref(coach)} className="grid grid-cols-[3.5rem_minmax(10rem,1.25fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_7rem_4rem] items-center gap-4 border-t border-white/10 px-5 py-3 text-sm transition hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-400">
            <CoachAvatar coach={coach} sizeClassName="h-10 w-10" />
            <span className="truncate font-bold text-white">{coach.displayName}</span>
            <span className="truncate text-white/65">{coach.primaryRoleLabel || "Trainer"}</span>
            <span className="truncate text-white/65">{teamLabel(coach)}</span>
            <CoachStatusBadge active={coach.isActive} />
            <span className="flex items-center justify-end text-white/45"><span className="sr-only">Details zu {coach.displayName}</span><ChevronRight size={18} aria-hidden="true" /></span>
          </Link>
        ))}
      </AdminCard>
    </div>
  );
}
