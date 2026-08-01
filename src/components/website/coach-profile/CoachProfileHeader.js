import CoachProfileContactActions from "./CoachProfileContactActions";

export default function CoachProfileHeader({ coach, fullName, contact }) {
  const isActive = coach.isActive ?? coach.is_active ?? true;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Trainerprofil
      </p>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <h1 className="text-5xl font-black md:text-7xl">
          {fullName}
        </h1>

        <CoachProfileContactActions contact={contact} email={coach.email} />
      </div>

      {!isActive && (
        <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
          Dieser Trainer ist aktuell im Adminbereich deaktiviert.
        </div>
      )}
    </div>
  );
}
