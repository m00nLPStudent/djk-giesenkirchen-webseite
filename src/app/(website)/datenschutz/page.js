import { notFound } from "next/navigation";
import RichTextContent from "@/components/website/content/RichTextContent";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { supabase } from "@/lib/supabase";

async function getPublishedPage(slug) {
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return data;
}

export default async function DatenschutzPage() {
  const page = await getPublishedPage("datenschutz");

  return (
    <PublicPageShell width="max-w-5xl">
        <PublicPageHero eyebrow="Rechtliches" title={page.title_de || page.title_en || "Datenschutz"} />

        <PublicCard as="article" className="mt-10">
          <RichTextContent content={page.content_de || page.content_en || ""} />
        </PublicCard>

        <PublicCard as="section" className="mt-8">
          <h2 className="text-2xl font-black">Technische Hinweise zu externen Inhalten</h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-white/65">
            <p>Die Website speichert deine Consent-Entscheidung lokal im Browser. Sie enthält nur Version, Kategorien und Änderungszeitpunkt, keine Nutzer-ID.</p>
            <p>Spielpläne und Tabellen von FUSSBALL.DE werden als externer Inhalt erst nach deiner Zustimmung geladen. Gleiches gilt für eine interaktive Google-Maps-Karte, sofern sie konfiguriert ist. Normale Links zu Google Maps und sozialen Netzwerken stellen erst durch deinen Klick eine Verbindung zum jeweiligen Ziel her.</p>
            <p>Daten aus click-TT/myTischtennis werden ausschließlich serverseitig abgerufen und als begrenzte Vereins-Sportdaten ausgegeben; der Browser lädt dabei kein Script oder Embed dieses Anbieters. Für Login und Adminbereich verwendet Supabase technisch notwendige Authentifizierungs- und Sessionmechanismen.</p>
            <p className="text-sm text-white/50">Die abschließende rechtliche Prüfung der Betreiberangaben, Rechtsgrundlagen und anbieterbezogenen Pflichtinformationen erfolgt durch den Betreiber.</p>
          </div>
        </PublicCard>
    </PublicPageShell>
  );
}
