"use client";

import { useState } from "react";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import { resolvePlayerImageUrl } from "@/lib/people/imageUrl";

export default function PlayerAvatar({ player, sizeClassName = "h-12 w-12" }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const name = player?.displayName || "Spieler";
  const imageUrl = resolvePlayerImageUrl(player, PLAYER_PLACEHOLDER_IMAGE);
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  if (loadFailed) {
    return <span role="img" aria-label={`Platzhalterbild für ${name}`} className={`inline-flex shrink-0 items-center justify-center rounded-full bg-red-700 font-black text-white ${sizeClassName}`}>{initial}</span>;
  }

  return (
    // Native error handling is required for existing external storage URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={`Profilbild von ${name}`} onError={() => setLoadFailed(true)} className={`shrink-0 rounded-full object-cover ${sizeClassName}`} />
  );
}
