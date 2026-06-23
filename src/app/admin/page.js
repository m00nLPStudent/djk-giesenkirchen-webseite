import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-20 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          Adminbereich
        </p>

        <h1 className="mt-6 text-6xl font-black">
          Dashboard
        </h1>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
       <Link
  href="/admin/news"
  className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:border-red-500 hover:bg-white/10"
>
  <h2 className="text-2xl font-black">
    News verwalten
  </h2>

  <p className="mt-4 text-white/60">
    Beiträge erstellen, bearbeiten und veröffentlichen.
  </p>
</Link>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-black">Mannschaften</h2>
            <p className="mt-4 text-white/60">
              Mannschaften, Bilder und Trainingszeiten pflegen.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-black">Spieler & Trainer</h2>
            <p className="mt-4 text-white/60">
              Kader, Rückennummern, Positionen und Bilder verwalten.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}