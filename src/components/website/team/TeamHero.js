export default function TeamHero({ team }) {
  if (!team?.team_image_url) return null;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10">
      <img
        src={team.team_image_url}
        alt={team.name_de}
        className="h-[360px] w-full object-cover md:h-[500px]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400 md:text-sm">
          {team.season || "Saison 2026/2027"}
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-7xl">{team.name_de}</h1>

        <p className="mt-2 text-base text-white/80 md:text-xl">
          DJK/VfL Giesenkirchen 05/09 e.V.
        </p>
      </div>
    </section>
  );
}
