import Link from "next/link";

export default function FootballTeamCard({ team }) {
  return (
    <Link
      href={`/fussball/${team.slug}`}
      className="block rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-red-500/50 hover:bg-white/10"
    >
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-4">
        {team.team_image_url ? (
          <img
            src={team.team_image_url}
            alt={team.name_de}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-white/40">Kein Bild</span>
        )}
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.25em] text-red-400">
        {team.age_group || "Mannschaft"}
      </p>

      <h2 className="mt-3 text-2xl font-black">{team.name_de}</h2>

      <p className="mt-3 text-sm text-white/50">
        {team.training_times_de || "Trainingszeiten folgen."}
      </p>
    </Link>
  );
}
