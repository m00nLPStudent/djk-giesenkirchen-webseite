export default function TeamHero({ team }) {
  if (!team?.team_image_url) return null;

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/10">
      <img
        src={team.team_image_url}
        alt={team.name_de}
        className="h-[500px] w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-10 left-10">
        <p className="text-sm uppercase tracking-[0.35em] text-red-400">
          {team.season || "Saison 2026/2027"}
        </p>

        <h1 className="mt-2 text-7xl font-black">{team.name_de}</h1>

        <p className="mt-2 text-xl text-white/80">
          DJK/VfL Giesenkirchen 05/09 e.V.
        </p>
      </div>
    </div>
  );
}
