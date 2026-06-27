export default function PlayerProfileHeader({ player, fullName, genderLabel, team }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Spielerprofil
      </p>

      <h1 className="mt-5 text-5xl font-black md:text-7xl">
        {fullName}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {player.position_de && (
          <span className="rounded-full bg-red-600/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            {player.position_de}
          </span>
        )}

        {genderLabel && (
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
            {genderLabel}
          </span>
        )}

        {player.is_captain && (
          <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
            Spielführer
          </span>
        )}

        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          {team?.name_de || "Keine Mannschaft"}
        </span>
      </div>

      {!player.is_active && (
        <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
          Dieser Spieler ist aktuell im Adminbereich deaktiviert und wird öffentlich normalerweise nicht im Kader angezeigt.
        </div>
      )}

      {player.description_de && (
        <p className="mt-8 max-w-3xl text-lg leading-8 text-white/70">
          {player.description_de}
        </p>
      )}
    </div>
  );
}
