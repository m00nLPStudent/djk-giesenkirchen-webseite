export default function Home() {
  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">
              DJK/VfL
            </p>
            <h1 className="text-lg font-bold">
              Giesenkirchen 05/09 e.V.
            </h1>
          </div>

          <nav className="hidden gap-6 text-sm font-semibold uppercase text-white/80 lg:flex">
            <a href="#">News</a>
            <a href="#">Fußball</a>
            <a href="#">Tischtennis</a>
            <a href="#">Damen-Gymnastik</a>
            <a href="#">Termine</a>
            <a href="#">Kontakt</a>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a55,transparent_35%),linear-gradient(120deg,#101014_20%,#1b1b22_60%,#c4001a_140%)]" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Fußball • Tischtennis • Damen-Gymnastik
            </p>

            <h2 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
              Gemeinsam.
              <br />
              Stark.
              <br />
              Giesenkirchen.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
              Die moderne Vereinsplattform der DJK/VfL Giesenkirchen 05/09 e.V.
              mit aktuellen News, Mannschaften, Terminen, Galerien und allem
              rund um unseren Verein.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a className="rounded-full bg-red-600 px-6 py-3 font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/30">
                Aktuelle News
              </a>
              <a className="rounded-full border border-white/20 px-6 py-3 font-bold uppercase tracking-wide text-white/90">
                Mannschaften
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-red-700 to-black p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                Saison 2026/2027
              </p>
              <h3 className="mt-4 text-4xl font-black">
                Deine Heimat.
                <br />
                Dein Verein.
              </h3>
              <p className="mt-6 text-white/75">
                Hier entsteht ein moderner digitaler Treffpunkt für Mitglieder,
                Spieler, Eltern, Trainer, Fans und Sponsoren.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-black/30 p-4">
                  <strong className="block text-3xl">3</strong>
                  <span className="text-xs text-white/60">Abteilungen</span>
                </div>
                <div className="rounded-2xl bg-black/30 p-4">
                  <strong className="block text-3xl">∞</strong>
                  <span className="text-xs text-white/60">Teamgeist</span>
                </div>
                <div className="rounded-2xl bg-black/30 p-4">
                  <strong className="block text-3xl">100%</strong>
                  <span className="text-xs text-white/60">Verein</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}