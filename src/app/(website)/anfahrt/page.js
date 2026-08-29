import { MapPin } from "lucide-react";
import { GoogleMapsPanel } from "@/components/website/maps";
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
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-52 md:pb-24">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Besuch planen</p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Sportanlage & Anfahrt</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/60">Hier findest du die zentral gepflegte Vereinsadresse und den hinterlegten Weg zur Sportanlage.</p>
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
    </main>
  );
}
