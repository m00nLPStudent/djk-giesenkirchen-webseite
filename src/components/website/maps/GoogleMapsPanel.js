"use client";

import { useState } from "react";
import { ExternalLink, MapPinned } from "lucide-react";

export default function GoogleMapsPanel({ mapsUrl, embedUrl = null }) {
  const [showMap, setShowMap] = useState(false);

  if (!mapsUrl && !embedUrl) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center text-white/55">
        <div><MapPinned aria-hidden="true" className="mx-auto mb-4 text-red-500" size={36} /><p>Eine Kartenverknüpfung ist derzeit nicht hinterlegt.</p></div>
      </div>
    );
  }

  if (embedUrl && showMap) {
    return (
      <div className="aspect-video min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <iframe src={embedUrl} title="Google Maps – Sportanlage DJK/VfL Giesenkirchen" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
      <div className="max-w-lg">
        <MapPinned aria-hidden="true" className="mx-auto text-red-500" size={42} />
        <h2 className="mt-5 text-xl font-black">Google Maps</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          {embedUrl ? "Mit dem Laden der Karte werden Inhalte von Google Maps geladen." : "Für die interaktive Karte fehlt derzeit noch die notwendige Maps-Konfiguration."}
        </p>
        {embedUrl && (
          <button type="button" onClick={() => setShowMap(true)} className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">Google Maps anzeigen</button>
        )}
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`${embedUrl ? "ml-3" : ""} mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400`}>In Google Maps öffnen <ExternalLink aria-hidden="true" size={16} /></a>}
      </div>
    </div>
  );
}
