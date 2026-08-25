"use client";

import { useState } from "react";
import { loadTeamMediaPickerAction, uploadTeamMediaAction } from "@/app/admin/teams/actions";

export default function useTeamMedia({ teamId, initialMedia, initialSeasonMedia, setForm }) {
  const [selectedMedia, setSelectedMedia] = useState(initialMedia || null);
  const [selectedSeasonMedia, setSelectedSeasonMedia] = useState(initialSeasonMedia || null);

  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({
      ...current,
      team_image_media_asset_id: media?.id || null,
      remove_legacy_team_image: !media,
    }));
  }

  function handleSeasonMediaChange(media) {
    setSelectedSeasonMedia(media);
    setForm((current) => ({
      ...current,
      season_team_image_media_asset_id: media?.id || null,
      remove_legacy_season_team_image: !media,
    }));
  }

  return {
    selectedMedia,
    selectedSeasonMedia,
    handleMediaChange,
    handleSeasonMediaChange,
    resetSeasonMedia: (media) => setSelectedSeasonMedia(media || null),
    loadMediaAction: (filters) => loadTeamMediaPickerAction(filters, teamId || null),
    uploadMediaAction: (formData) => uploadTeamMediaAction(formData, teamId || null),
  };
}
