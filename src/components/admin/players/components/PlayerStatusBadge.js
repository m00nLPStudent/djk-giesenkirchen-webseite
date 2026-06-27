export default function PlayerStatusBadge({ active }) {
  if (active) {
    return (
      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
        Aktiv
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
      Pausiert
    </span>
  );
}
