"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
    >
      ← Zurück
    </button>
  );
}
