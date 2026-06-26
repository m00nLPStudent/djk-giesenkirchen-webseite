export default function DashboardWelcome({ plannedNewsCount = 0 }) {
  const today = new Date();

  const greeting =
    today.getHours() < 12
      ? "Guten Morgen"
      : today.getHours() < 18
        ? "Guten Tag"
        : "Guten Abend";

  return (
    <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
        Willkommen zurück
      </p>

      <h2 className="mt-3 text-3xl font-black">{greeting} Swen 👋</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-3xl font-black">{plannedNewsCount}</p>
          <p className="mt-1 text-sm text-white/50">geplante News</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-3xl font-black">1</p>
          <p className="mt-1 text-sm text-white/50">Training heute</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-3xl font-black">0</p>
          <p className="mt-1 text-sm text-white/50">Turniere am Wochenende</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-3xl font-black">0</p>
          <p className="mt-1 text-sm text-white/50">neue Medien</p>
        </div>
      </div>
    </section>
  );
}
