import Link from "next/link";
import { getUniqueAssignedTeams } from "../utils/coachStats";

export default function CoachTeamsOverview({ coaches = [] }) {
  const teams = getUniqueAssignedTeams(coaches);

  if (teams.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
        Noch keine Mannschaft zugeordnet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {teams.map((team) => (
        <div
          key={team.id}
          className="rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                Mannschaft
              </p>
              <h2 className="mt-2 text-2xl font-black">{team.name}</h2>
              <p className="mt-1 text-sm text-white/45">
                {team.coaches.length} Person(en) zugeordnet
              </p>
            </div>

            {team.slug && (
              <Link
                href={`/fussball/${team.slug}`}
                target="_blank"
                className="rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
              >
                Mannschaft ansehen
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {team.coaches.map((coach) => (
              <span
                key={coach.id}
                className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/70"
              >
                {coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim()} · {coach.role}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
