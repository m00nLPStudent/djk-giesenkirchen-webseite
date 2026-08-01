export default function PlayerProfileHeader({ player, fullName }) {
  const isActive = player.is_active ?? player.isActive;
  const description = player.description_de || player.descriptionDe || null;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Spielerprofil
      </p>

      <h1 className="mt-5 text-5xl font-black md:text-7xl">{fullName}</h1>

      {!isActive && (
        <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-yellow-200">
          Dieser Spieler ist aktuell im Adminbereich deaktiviert und wird
          oeffentlich normalerweise nicht im Kader angezeigt.
        </div>
      )}

      {description && (
        <p className="mt-8 max-w-3xl text-lg leading-8 text-white/70">
          {description}
        </p>
      )}
    </div>
  );
}
