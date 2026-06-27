import Link from "next/link";

export default function PlayerEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
      <h2 className="text-2xl font-black">Keine Spieler gefunden</h2>
      <p className="mx-auto mt-3 max-w-xl text-white/50">
        Passe deine Suche oder den Filter an oder lege direkt einen neuen Spieler an.
      </p>

      <Link
        href="/admin/players/new"
        className="mt-6 inline-flex rounded-full bg-red-600 px-6 py-3 font-bold transition hover:bg-red-700"
      >
        Neuer Spieler
      </Link>
    </div>
  );
}
