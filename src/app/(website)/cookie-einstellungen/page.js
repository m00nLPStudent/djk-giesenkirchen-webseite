import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

export const metadata = {
  title: "Cookie-Einstellungen | DJK/VfL Giesenkirchen",
  description: "Informationen zur vorbereiteten Cookie-Verwaltung.",
};

export default function CookieSettingsPage() {
  return (
    <PublicPageShell width="max-w-4xl">
      <PublicPageHero eyebrow="Datenschutz" title="Cookie-Einstellungen" />
      <PublicCard className="mt-10">
        <p className="mt-8 text-base leading-8 text-white/65">Die individuelle Cookie-Verwaltung wird derzeit vorbereitet. Bis zur Aktivierung werden hier keine Einstellungen vorgetäuscht.</p>
        <p className="mt-5 text-base leading-8 text-white/65">Weitere Informationen zur Verarbeitung personenbezogener Daten findest du in unserer <Link href="/datenschutz" className="font-bold text-red-400 underline decoration-red-400/40 underline-offset-4 transition hover:text-red-300">Datenschutzerklärung</Link>.</p>
      </PublicCard>
    </PublicPageShell>
  );
}
