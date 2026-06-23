import { supabase } from "@/lib/supabase";

export default async function TeamPage({ params }) {
  const { slug } = await params;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: coaches } = await supabase
    .from("coaches")
    .select("*")
    .eq("team_id", team?.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team?.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-7xl">
            {team?.team_image_url && (
  <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/10">

    <img
      src={team.team_image_url}
      alt={team.name_de}
      className="h-[500px] w-full object-cover"
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

    <div className="absolute bottom-10 left-10">
  <p className="text-sm uppercase tracking-[0.35em] text-red-400">
    Saison 2026/2027
  </p>

  <h1 className="mt-2 text-7xl font-black">
    E1 Jugend
  </h1>

  <p className="mt-2 text-xl text-white/80">
    DJK/VfL Giesenkirchen 05/09 e.V.
  </p>
</div>

  </div>
)}
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Fußballabteilung
          </p>

          <h1 className="mt-6 text-6xl font-black">{team?.name_de}</h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            {team?.description_de || "Mannschaftsbeschreibung folgt."}
          </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">

  <h2 className="text-3xl font-black">
    Trainingsinformationen
  </h2>

  <div className="mt-8 grid gap-6 md:grid-cols-3">

    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-red-400">
        Training
      </p>

      <p className="mt-2 text-lg">
        Dienstag & Donnerstag
      </p>

      <p className="text-white/60">
        17:00 - 18:45 Uhr
      </p>
    </div>

    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-red-400">
        Treffpunkt
      </p>

      <p className="mt-2 text-lg">
        16:50 Uhr
      </p>
    </div>

    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-red-400">
        Ort
      </p>

      <p className="mt-2 text-lg">
        Bezirksportanlage Giesenkirchen
      </p>
    </div>

  </div>
</div>

          <section className="mt-16">
  <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
    Trainerteam
  </p>

  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {coaches?.map((coach) => (
      <div
        key={coach.id}
        className="rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-700 text-3xl font-black">
            {coach.photo_url ? (
  <img
    src={coach.photo_url}
    alt={coach.name}
    className="h-24 w-24 rounded-full object-cover"
  />
) : (
  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-700 text-3xl font-black">
    {coach.name.charAt(0)}
  </div>
)}
          </div>

          <div>
            <h3 className="text-3xl font-black">
              {coach.name}
            </h3>

            <p className="mt-2 text-white/60">
              {coach.role_de}
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

          <section className="mt-16">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Kader
            </p>

            <h2 className="mt-4 text-4xl font-black">Spieler</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players?.map((player) => (
                <div
                  key={player.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  {player.photo_url ? (
  <img
    src={player.photo_url}
    alt={`${player.first_name} ${player.last_name || ""}`}
    className="h-28 w-full rounded-2xl object-cover"
  />
) : (
  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-700 text-3xl font-black">
    {player.shirt_number || "-"}
  </div>
)}

                  <h3 className="mt-6 text-2xl font-black leading-tight">
                    {player.first_name} {player.last_name}
                  </h3>

                  <p className="mt-3 text-white/60">
                    {player.position_de || "Spieler"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}