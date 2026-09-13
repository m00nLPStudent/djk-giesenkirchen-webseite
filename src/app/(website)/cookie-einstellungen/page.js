import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import ConsentSettingsButton from "@/components/website/consent/ConsentSettingsButton";

export const metadata = {
  title: "Cookie-Einstellungen",
  description: "Datenschutz- und Cookie-Einstellungen verwalten.",
};

export default function CookieSettingsPage() {
  return (
    <PublicPageShell width="max-w-4xl">
      <PublicPageHero eyebrow="Datenschutz" title="Cookie-Einstellungen" />
      <PublicCard className="mt-10">
        <p className="mt-8 text-base leading-8 text-white/65">Hier kannst du deine Entscheidung zu optionalen externen Inhalten jederzeit ändern oder widerrufen. Technisch notwendige Funktionen bleiben immer aktiv.</p>
        <ConsentSettingsButton className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400" />
        <p className="mt-5 text-base leading-8 text-white/65">Weitere Informationen zur Verarbeitung personenbezogener Daten findest du in unserer <Link href="/datenschutz" className="font-bold text-red-400 underline decoration-red-400/40 underline-offset-4 transition hover:text-red-300">Datenschutzerklärung</Link>.</p>
      </PublicCard>
    </PublicPageShell>
  );
}
