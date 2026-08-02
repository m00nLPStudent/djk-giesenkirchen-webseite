"use client";

import { useState } from "react";

export function AdminDecorativeBackgroundImage({ src, position = "center" }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* The canonical URL may point to any configured storage host. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onError={() => setFailedSrc(src)}
        className="h-full w-full scale-[1.01] object-cover opacity-[0.11] grayscale saturate-50 blur-[1px]"
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(18,18,20,0.91),rgba(18,18,20,0.87)_58%,rgba(127,29,29,0.07))] max-md:bg-[linear-gradient(115deg,rgba(18,18,20,0.93),rgba(18,18,20,0.9)_65%,rgba(127,29,29,0.05))]" />
    </div>
  );
}
