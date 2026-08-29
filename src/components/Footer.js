import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import SocialLinks from "@/components/common/SocialLinks";
import { PUBLIC_SITE_LOGO_URL, PUBLIC_SITE_NAME } from "@/config/publicSite";
import { formatGermanPhoneNumberReadable } from "@/lib/phone";
import { resolveSocialLinks } from "@/lib/socialLinks";
import { supabase } from "@/lib/supabase";

function formatAddress(settings) {
  const street = [settings?.street, settings?.house_number].filter(Boolean).join(" ");
  const city = [settings?.postal_code, settings?.city].filter(Boolean).join(" ");
  return [street, city].filter(Boolean);
}

const footerColumns = [
  {
    title: "Verein",
    links: [
      { label: "News", href: "/news/uebersicht" },
      { label: "Termine", href: "/termine/allgemein" },
      { label: "Downloads", href: "/downloads" },
      { label: "Vereinsgeschichte", href: "/verein/vereinsgeschichte" },
      { label: "Vorstand", href: "/verein/vorstand" },
    ],
  },
  {
    title: "Sportarten",
    links: [
      { label: "Fußball Senioren", href: "/fussball/mannschaften/senioren" },
      { label: "Fußball Jugend", href: "/fussball/mannschaften/junioren" },
      { label: "Tischtennis", href: "/tischtennis" },
      { label: "Behindertensport", href: "/behindertensport" },
      { label: "Gymnastikdamen", href: "/damen-gymnastik" },
    ],
  },
  {
    title: "Weitere Links",
    links: [
      { label: "Mitglied werden", href: "/mitglied-werden" },
      { label: "Sponsoren", href: "/fussball/sponsoren" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
];

function FooterLinkColumn({ title, links }) {
  const headingId = `footer-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="text-xs font-black uppercase tracking-[0.24em] text-red-500">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Footer() {
  const [settingsResult, pagesResult] = await Promise.all([
    supabase.from("club_settings").select("*").eq("singleton", true).maybeSingle(),
    supabase
      .from("pages")
      .select("slug, title_de, title_en")
      .in("slug", ["impressum", "datenschutz"])
      .eq("is_published", true),
  ]);

  const settings = settingsResult?.data || null;
  const pageBySlug = Object.fromEntries((pagesResult?.data || []).map((page) => [page.slug, page]));
  const addressLines = formatAddress(settings);
  const phone = formatGermanPhoneNumberReadable(settings?.phone || "");
  const phoneHref = String(settings?.phone || "").replace(/[^+\d]/g, "");
  const socialLinks = resolveSocialLinks(settings?.social_links);
  const clubName = settings?.club_name || PUBLIC_SITE_NAME;

  return (
    <footer className="border-t border-white/10 bg-[#08080c] px-5 pt-16 pb-8 text-white sm:px-6 lg:pt-20">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.45fr_0.8fr_0.9fr_0.8fr_1.2fr]">
          <section aria-labelledby="footer-club-presentation" className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <div className="flex items-center gap-4">
              <img src={PUBLIC_SITE_LOGO_URL} alt="Logo der DJK/VfL Giesenkirchen" className="h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-500">Gemeinsam. Stark.</p>
                <h2 id="footer-club-presentation" className="mt-1 text-xl font-black">{clubName}</h2>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
              DJK/VfL Giesenkirchen ist mehr als nur ein Sportverein – wir fördern Gemeinschaft, Gesundheit und Leidenschaft durch vielfältige Sportangebote für alle Altersgruppen.
            </p>
            <SocialLinks links={socialLinks} name={settings?.short_name || "DJK/VfL Giesenkirchen"} className="mt-6" />
          </section>

          {footerColumns.map((column) => <FooterLinkColumn key={column.title} {...column} />)}

          <section aria-labelledby="footer-contact">
            <h3 id="footer-contact" className="text-xs font-black uppercase tracking-[0.24em] text-red-500">Kontakt</h3>
            <p className="mt-5 text-sm font-bold leading-6 text-white/80">{clubName}</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/60">
              {addressLines.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <MapPin aria-hidden="true" size={16} className="mt-1 shrink-0 text-red-500" />
                  <div>{addressLines.map((line) => <p key={line}>{line}</p>)}</div>
                </div>
              )}
              {phone && (
                <a href={`tel:${phoneHref}`} className="flex items-start gap-2.5 break-words transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500">
                  <Phone aria-hidden="true" size={16} className="mt-1 shrink-0 text-red-500" />
                  <span>{phone}</span>
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-start gap-2.5 break-all transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500">
                  <Mail aria-hidden="true" size={16} className="mt-1 shrink-0 text-red-500" />
                  <span>{settings.email}</span>
                </a>
              )}
            </div>
          </section>
        </div>

        <div className="mt-14 border-t border-white/10 pt-7">
          <div className="flex flex-col gap-5 text-sm text-white/45 md:flex-row md:items-end md:justify-between">
            <p>© {new Date().getFullYear()} {clubName}. Alle Rechte vorbehalten.</p>
            <nav aria-label="Rechtliche Hinweise" className="flex flex-wrap gap-x-5 gap-y-2">
              {pageBySlug.impressum && <Link href="/impressum" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500">{pageBySlug.impressum.title_de || pageBySlug.impressum.title_en || "Impressum"}</Link>}
              {pageBySlug.datenschutz && <Link href="/datenschutz" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500">{pageBySlug.datenschutz.title_de || pageBySlug.datenschutz.title_en || "Datenschutz"}</Link>}
              <Link href="/cookie-einstellungen" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-500">Cookie-Einstellungen</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
