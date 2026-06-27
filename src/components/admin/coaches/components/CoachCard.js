"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { COUNTRIES } from "@/constants";
import { deleteCoachCompletely } from "../services/coaches.service";
import CoachStatusBadge from "./CoachStatusBadge";

function getCountry(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim().toLowerCase();

  return (
    COUNTRIES.find((country) => {
      return (
        country.iso.toLowerCase() === normalizedValue ||
        country.de.toLowerCase() === normalizedValue ||
        country.en.toLowerCase() === normalizedValue
      );
    }) || null
  );
}

function FlagIcon({ country }) {
  if (!country || country.iso === "OTHER") return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${country.iso.toLowerCase()}.png`}
      alt={country.de}
      className="h-4 w-6 rounded-sm object-cover ring-1 ring-white/20"
    />
  );
}

export default function CoachCard({ coach }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const country = getCountry(coach.nationality);
  const imageUrl = coach.image_url || COACH_PLACEHOLDER_IMAGE;
  const fullName = coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || "Trainer";

  async function handleDelete() {
    const confirmed = window.confirm(
      `Trainer „${fullName}“ wirklich komplett löschen?\n\nDas Profil und ein eigenes Trainerbild werden dauerhaft entfernt.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    const { error } = await deleteCoachCompletely(coach);
    setDeleting(false);

    if (error) {
      alert("Fehler beim Löschen: " + error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50 hover:bg-white/10 md:grid-cols-[140px_1fr]">
      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-black/20">
        <img
          src={imageUrl}
          alt={fullName}
          className="h-full w-full object-cover"
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {coach.role || "Trainer"}
          </span>

          <CoachStatusBadge active={coach.is_active} />

          <span className="text-sm text-white/40">
            {coach.team_name || "Keine Mannschaft"}
          </span>

          {country && (
            <span className="inline-flex items-center gap-2 text-sm text-white/50">
              <FlagIcon country={country} />
              {country.de}
            </span>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-black">{fullName}</h2>

        <p className="mt-3 max-w-3xl text-white/60">
          {coach.email || "Keine E-Mail hinterlegt"}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/admin/coaches/edit/${coach.id}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Bearbeiten
          </Link>

          <Link
            href={`/trainer/${coach.slug}`}
            target="_blank"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Profil ansehen
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "Löscht..." : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}
