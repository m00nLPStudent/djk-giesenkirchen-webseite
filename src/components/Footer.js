import Link from "next/link";

const footerColumns = [
  {
    title: "Verein",
    links: [
      { label: "Kontakt", href: "/kontakt" },
      { label: "Vorstand", href: "/fussball/abteilung/vorstand" },
      { label: "Trainer", href: "/fussball/abteilung/trainer" },
      { label: "Sponsoren", href: "/fussball/sponsoren" },
    ],
  },
  {
    title: "Abteilungen",
    links: [
      { label: "Fußball", href: "/fussball" },
      { label: "Tischtennis", href: "/tischtennis" },
      { label: "Damen-Gymnastik", href: "/damen-gymnastik" },
      { label: "Termine", href: "/termine" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "News", href: "/news" },
      { label: "News Übersicht", href: "/news/uebersicht" },
      { label: "Aktuelle Termine", href: "/termine" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Impressum", href: "/impressum" },
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0b0f] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-4">
              <img
                src="https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png"
                alt="DJK/VfL Giesenkirchen"
                className="h-16 w-16 object-contain"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.32em] text-red-400">
                  Gemeinsam. Stark.
                </p>
                <h2 className="mt-1 text-2xl font-black">Giesenkirchen</h2>
              </div>
            </div>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              Die DJK/VfL Giesenkirchen 05/09 e.V. informiert über Sportangebote, Neuigkeiten, Termine und die Arbeit der Abteilungen im Verein.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-red-400">
                  {column.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-white/55 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} DJK/VfL Giesenkirchen 05/09 e.V.</p>
          <p>Vereinswebseite · News, Mannschaften und Termine</p>
        </div>
      </div>
    </footer>
  );
}
