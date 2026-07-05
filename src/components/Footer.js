import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatGermanPhoneNumberReadable } from "@/lib/phone";

function formatAddress(settings) {
  const street = [settings?.street, settings?.house_number]
    .filter(Boolean)
    .join(" ");
  const city = [settings?.postal_code, settings?.city]
    .filter(Boolean)
    .join(" ");
  return [street, city].filter(Boolean);
}

export default async function Footer() {
  const [settingsResult, pagesResult] = await Promise.all([
    supabase
      .from("club_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle(),
    supabase
      .from("pages")
      .select("slug, title_de, title_en, sort_order")
      .eq("show_in_footer", true)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const settings = settingsResult?.data || null;
  const footerPages = pagesResult?.data || [];
  const pageBySlug = Object.fromEntries(
    footerPages.map((page) => [page.slug, page]),
  );
  const additionalLegalPages = footerPages.filter(
    (page) =>
      !["datenschutz", "impressum", "mitglied-werden"].includes(page.slug),
  );
  const addressLines = formatAddress(settings);
  const phone = formatGermanPhoneNumberReadable(settings?.phone || "");
  const footerColumns = [
    {
      title: "Verein",
      links: [
        { label: "News", href: "/news" },
        { label: "News Übersicht", href: "/news/uebersicht" },
        { label: "Termine", href: "/termine" },
        { label: "Vereinsgeschichte", href: "/fussball/vereinsgeschichte" },
      ],
    },
    {
      title: "Abteilungen",
      links: [
        { label: "Fußball", href: "/fussball" },
        { label: "Tischtennis", href: "/tischtennis" },
        { label: "Damen-Gymnastik", href: "/damen-gymnastik" },
        { label: "Mitglied werden", href: "/mitglied-werden" },
      ],
    },
    {
      title: "Rechtliches",
      links: [
        ...(pageBySlug.datenschutz
          ? [
              {
                label: pageBySlug.datenschutz.title_de || "Datenschutz",
                href: "/datenschutz",
              },
            ]
          : []),
        ...(pageBySlug.impressum
          ? [
              {
                label: pageBySlug.impressum.title_de || "Impressum",
                href: "/impressum",
              },
            ]
          : []),
        ...additionalLegalPages.map((page) => ({
          label: page.title_de || page.title_en || page.slug,
          href: `/${page.slug}`,
        })),
        { label: "Kontakt", href: "/kontakt" },
        { label: "Cookie-Einstellungen", href: "#" },
      ],
    },
  ];

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
                <h2 className="mt-1 text-2xl font-black">
                  {settings?.short_name || "Giesenkirchen"}
                </h2>
              </div>
            </div>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              {settings?.club_name || "DJK/VfL Giesenkirchen 05/09 e.V."}{" "}
              informiert über Sportangebote, Neuigkeiten, Termine und die Arbeit
              der Abteilungen im Verein.
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/60">
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {settings?.email && (
                <p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="transition hover:text-white"
                  >
                    {settings.email}
                  </a>
                </p>
              )}
              {phone && <p>{phone}</p>}
            </div>
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
          <p>
            © {new Date().getFullYear()}{" "}
            {settings?.club_name || "DJK/VfL Giesenkirchen 05/09 e.V."}
          </p>
          <p>Vereinswebseite · News, Mannschaften und Termine</p>
        </div>
      </div>
    </footer>
  );
}
