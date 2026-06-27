"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { COUNTRIES } from "@/constants";
import EntityBadge from "@/components/admin/ui/EntityBadge";
import {
  EntityActionLink,
  EntityCard,
  EntityCardActions,
  EntityCardBadges,
  EntityCardMeta,
  EntityCardTitle,
  EntityDeleteButton,
} from "@/components/admin/ui/EntityCard";
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

function getTeamName(coach) {
  if (coach.teams?.name_de) return coach.teams.name_de;
  if (coach.team_name) return coach.team_name;
  return "Keine Mannschaft";
}

export default function CoachCard({ coach }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const country = getCountry(coach.nationality);
  const imageUrl = coach.image_url || COACH_PLACEHOLDER_IMAGE;
  const fullName = coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim() || "Trainer";
  const teamName = getTeamName(coach);

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
    <EntityCard image={imageUrl} imageAlt={fullName}>
      <EntityCardBadges>
        <EntityBadge variant="red">{coach.role || "Trainer"}</EntityBadge>
        <CoachStatusBadge active={coach.is_active} />
        <EntityBadge>{teamName}</EntityBadge>
        {country && (
          <EntityBadge>
            <FlagIcon country={country} />
            {country.de}
          </EntityBadge>
        )}
      </EntityCardBadges>

      <EntityCardTitle>{fullName}</EntityCardTitle>
      <EntityCardMeta>{coach.email || "Keine E-Mail hinterlegt"}</EntityCardMeta>

      <EntityCardActions>
        <EntityActionLink href={`/admin/coaches/edit/${coach.id}`}>
          Bearbeiten
        </EntityActionLink>
        <EntityActionLink href={`/trainer/${coach.slug}`} target="_blank">
          Profil ansehen
        </EntityActionLink>
        <EntityDeleteButton onClick={handleDelete} deleting={deleting} />
      </EntityCardActions>
    </EntityCard>
  );
}
