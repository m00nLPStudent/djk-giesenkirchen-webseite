"use client";

import { useState } from "react";
import { loadTeamMediaPickerAction, uploadTeamMediaAction } from "@/app/admin/teams/actions";

export default function useTeamMedia({ teamId, initialMedia, initialSeasonMedia, initialContactMedia, initialSeasonContactMedia, setForm }) {
  const [selectedMedia, setSelectedMedia] = useState(initialMedia || null);
  const [selectedSeasonMedia, setSelectedSeasonMedia] = useState(initialSeasonMedia || null);
  const [selectedContactMedia, setSelectedContactMedia] = useState(initialContactMedia || null);
  const [selectedSeasonContactMedia, setSelectedSeasonContactMedia] = useState(initialSeasonContactMedia || null);

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

  function handleContactMediaChange(media) {
    setSelectedContactMedia(media);
    setForm((current) => ({ ...current, contact_image_media_asset_id: media?.id || null, remove_legacy_contact_image: !media }));
  }

  function handleSeasonContactMediaChange(media) {
    setSelectedSeasonContactMedia(media);
    setForm((current) => ({ ...current, season_contact_image_media_asset_id: media?.id || null, remove_legacy_season_contact_image: !media }));
  }

  return {
    selectedMedia,
    selectedSeasonMedia,
    selectedContactMedia,
    selectedSeasonContactMedia,
    handleMediaChange,
    handleSeasonMediaChange,
    handleContactMediaChange,
    handleSeasonContactMediaChange,
    resetSeasonMedia: (media, contactMedia) => { setSelectedSeasonMedia(media || null); setSelectedSeasonContactMedia(contactMedia || null); },
    loadMediaAction: (filters) => loadTeamMediaPickerAction(filters, teamId || null),
    uploadMediaAction: (formData) => uploadTeamMediaAction(formData, teamId || null),
  };
}
