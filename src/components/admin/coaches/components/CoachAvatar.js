"use client";

import { useState } from "react";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { resolveCoachImageUrl } from "@/lib/people/imageUrl";

export default function CoachAvatar({ coach, sizeClassName = "h-12 w-12" }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const name = coach?.displayName || coach?.name || "Trainer";
  const imageUrl = resolveCoachImageUrl(coach, COACH_PLACEHOLDER_IMAGE);
  const initial = name.trim().charAt(0).toUpperCase() || "T";

  if (loadFailed) {
    return (
      <span
        role="img"
        aria-label={`Platzhalterbild für ${name}`}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-red-700 font-black text-white ${sizeClassName}`}
      >
        {initial}
      </span>
    );
  }

  return (
    // The admin avatar intentionally uses native image error handling for remote storage URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={`Profilbild von ${name}`}
      onError={() => setLoadFailed(true)}
      className={`shrink-0 rounded-full object-cover ${sizeClassName}`}
    />
  );
}
