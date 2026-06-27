export default function PlayerProfileHeader({ player, fullName }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Spielerprofil
      </p>

      <h1 className="mt-5 text-5xl font-black md:text-7xl">
        {fullName}
      </h1>

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
