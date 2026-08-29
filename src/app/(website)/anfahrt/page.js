import { MapPin } from "lucide-react";
import { GoogleMapsPanel } from "@/components/website/maps";
import { PublicPageHero, PublicPageShell } from "@/components/website/layout";
import { PUBLIC_SITE_NAME } from "@/config/publicSite";
import { buildGoogleMapsEmbedUrl, normalizeGoogleMapsUrl } from "@/lib/maps";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Sportanlage & Anfahrt | DJK/VfL Giesenkirchen",
  description: "Adresse und Anfahrt zur Sportanlage der DJK/VfL Giesenkirchen.",
};

export const dynamic = "force-dynamic";

export default async function DirectionsPage() {
  const { data: settings } = await supabase.from("club_settings").select("club_name, street, house_number, postal_code, city, google_maps_url").eq("singleton", true).maybeSingle();
  const street = [settings?.street, settings?.house_number].filter(Boolean).join(" ");
  const city = [settings?.postal_code, settings?.city].filter(Boolean).join(" ");
  const mapsUrl = normalizeGoogleMapsUrl(settings?.google_maps_url);
  const addressQuery = [settings?.club_name || PUBLIC_SITE_NAME, street, city].filter(Boolean).join(", ");
  const embedUrl = buildGoogleMapsEmbedUrl({ apiKey: process.env.GOOGLE_MAPS_EMBED_API_KEY, query: addressQuery });

  return (
    <PublicPageShell width="max-w-6xl">
      <section>
        <PublicPageHero eyebrow="Besuch planen" title="Sportanlage & Anfahrt" description="Hier findest du die zentral gepflegte Vereinsadresse und den hinterlegten Weg zur Sportanlage." />
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.75fr_1.4fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8" aria-labelledby="directions-address">
            <MapPin aria-hidden="true" className="text-red-500" size={30} />
            <h2 id="directions-address" className="mt-5 text-xl font-black">Adresse</h2>
            <address className="mt-4 not-italic leading-7 text-white/65">
              <p className="font-bold text-white/85">{settings?.club_name || PUBLIC_SITE_NAME}</p>
              {street && <p>{street}</p>}
              {city && <p>{city}</p>}
              {!street && !city && <p>Eine Anschrift ist derzeit nicht hinterlegt.</p>}
            </address>
          </section>
          <GoogleMapsPanel mapsUrl={mapsUrl} embedUrl={embedUrl} />
        </div>
      </section>
    </PublicPageShell>
  );
}
