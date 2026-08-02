"use client";

import { useState } from "react";

export default function SponsorLogo({ src, name = "Sponsor", className = "h-12 w-16", large = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const available = Boolean(String(src || "").trim() && failedSrc !== src);
  const initial = String(name || "S").trim().charAt(0).toLocaleUpperCase("de-DE") || "S";
  const sizeClass = large ? "h-20 w-24 rounded-2xl" : `${className} rounded-xl`;

  return <span className={`flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.05] ${sizeClass}`}>{available ? <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={`Logo von ${name}`} onError={() => setFailedSrc(src)} className="h-full w-full object-contain p-1.5" />
  </> : <span aria-label={`Kein Logo für ${name}`} className="text-lg font-black text-white/35">{initial}</span>}</span>;
}
