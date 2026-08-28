import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatGermanPhoneNumberReadable } from "@/lib/phone";
import SocialLinks from "@/components/common/SocialLinks";
import { PUBLIC_SITE_LOGO_URL, PUBLIC_SITE_NAME } from "@/config/publicSite";

function formatAddress(settings) {
  const street = [settings?.street, settings?.house_number].filter(Boolean).join(" ");
  const city = [settings?.postal_code, settings?.city].filter(Boolean).join(" ");
  return [street, city].filter(Boolean);
}

function normalizeSocialLinks(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    facebook: value.facebook || "",
    instagram: value.instagram || "",
    tiktok: value.tiktok || "",
  };
}

export default async function Footer() {
  const [settingsResult, pagesResult] = await Promise.all([
    supabase.from("club_settings").select("*").eq("singleton", true).maybeSingle(),
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
  const pageBySlug = Object.fromEntries(footerPages.map((page) => [page.slug, page]));
  const addressLines = formatAddress(settings);
  const phone = formatGermanPhoneNumberReadable(settings?.phone || "");
  const socialLinks = normalizeSocialLinks(settings?.social_links);
  const footerColumns = [
    {
      title: "Verein",
      links: [
        { label: "News", href: "/news" },
        { label: "News-Übersicht", href: "/news/uebersicht" },
        { label: "Termine", href: "/termine" },
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

  return (
    <footer className="border-t border-white/10 bg-[#09090d] px-5 py-14 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_2fr]">
          <div>
            <div className="flex items-center gap-4">
              <img src={PUBLIC_SITE_LOGO_URL} alt="Logo der DJK/VfL Giesenkirchen" className="h-16 w-16 object-contain" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">Gemeinsam. Stark.</p>
                <h2 className="mt-1 text-xl font-black">{settings?.short_name || "Giesenkirchen"}</h2>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              {settings?.club_name || PUBLIC_SITE_NAME} – ein Gesamtverein mit Fußball, Tischtennis, Behindertensport und Gymnastikdamen.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/65">
              {addressLines.map((line) => <p key={line}>{line}</p>)}
              {settings?.email && <p><a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></p>}
              {phone && <p><a href={`tel:${String(settings?.phone || "").replace(/[^+\d]/g, "")}`} className="hover:text-white">{phone}</a></p>}
            </div>
            <SocialLinks links={socialLinks} name={settings?.short_name || "DJK/VfL Giesenkirchen"} className="mt-6" />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {footerColumns.map((column) => (
              <section key={column.title} aria-labelledby={`footer-${column.title.toLowerCase().replace(" ", "-")}`}>
                <h3 id={`footer-${column.title.toLowerCase().replace(" ", "-")}`} className="text-xs font-black uppercase tracking-[0.24em] text-red-400">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}><Link href={link.href} className="text-sm text-white/65 transition hover:text-white focus-visible:outline-2 focus-visible:outline-red-400">{link.label}</Link></li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-7 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>{settings?.copyright_text || `© ${new Date().getFullYear()} ${settings?.club_name || PUBLIC_SITE_NAME}. Alle Rechte vorbehalten.`}</p>
          <nav aria-label="Rechtliche Hinweise" className="flex flex-wrap gap-x-5 gap-y-2">
            {pageBySlug.impressum && <Link href="/impressum" className="hover:text-white">{pageBySlug.impressum.title_de || "Impressum"}</Link>}
            {pageBySlug.datenschutz && <Link href="/datenschutz" className="hover:text-white">{pageBySlug.datenschutz.title_de || "Datenschutz"}</Link>}
          </nav>
        </div>
      </div>
    </footer>
  );
}
