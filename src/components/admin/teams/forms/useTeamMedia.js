"use client";

import { useState } from "react";
import { loadTeamMediaPickerAction, uploadTeamMediaAction } from "@/app/admin/teams/actions";

export default function useTeamMedia({ teamId, initialMedia, setForm }) {
  const [selectedMedia, setSelectedMedia] = useState(initialMedia || null);

  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({
      ...current,
      team_image_media_asset_id: media?.id || null,
      remove_legacy_team_image: !media,
    }));
  }

  return {
    selectedMedia,
    handleMediaChange,
    loadMediaAction: (filters) => loadTeamMediaPickerAction(filters, teamId || null),
    uploadMediaAction: (formData) => uploadTeamMediaAction(formData, teamId || null),
  };
}
