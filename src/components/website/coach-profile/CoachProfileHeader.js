import CoachProfileContactActions from "./CoachProfileContactActions";

export default function CoachProfileHeader({ coach, fullName, team, contact }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Trainerprofil
      </p>

      <h1 className="mt-5 text-5xl font-black md:text-7xl">
        {fullName}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-red-600/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
          {coach.role || "Trainer"}
        </span>

        {coach.license && (
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
            {coach.license}
          </span>
        )}

        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          {team?.name_de || coach.team_name || "Keine Mannschaft"}
        </span>

        <CoachProfileContactActions contact={contact} email={coach.email} />
      </div>

      {!coach.is_active && (
        <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
          Dieser Trainer ist aktuell im Adminbereich deaktiviert.
        </div>
      )}
    </div>
  );
}
