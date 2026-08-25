"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveTeamWithScopeAction } from "@/app/admin/teams/actions";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import { FormAlert } from "@/components/admin/forms";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import TeamFormTabs from "./components/TeamFormTabs";
import TeamSubmitBar from "./components/TeamSubmitBar";
import { createInitialTeamForm } from "./helpers/teamFormInitialState";
import { createTeamFormPayload } from "./helpers/teamFormPayload";
import { getCurrentSeason, getPersonName } from "./helpers/teamFormOptions";
import TeamBaseTab from "./tabs/TeamBaseTab";
import TeamCompetitionTab from "./tabs/TeamCompetitionTab";
import TeamContactTab from "./tabs/TeamContactTab";
import TeamDescriptionTab from "./tabs/TeamDescriptionTab";
import TeamMediaTab from "./tabs/TeamMediaTab";
import TeamPlayersTab from "./tabs/TeamPlayersTab";
import TeamSeasonTab from "./tabs/TeamSeasonTab";
import TeamSettingsTab from "./tabs/TeamSettingsTab";
import TeamStaffTab from "./tabs/TeamStaffTab";
import TeamTrainingTab from "./tabs/TeamTrainingTab";
import useTeamScope from "../useTeamScope";
import { isYouthTeam } from "../teamScope";
import useTeamMedia from "./useTeamMedia";

function getCoachStatusMessage(currentSeasonResolution, currentTeamSeasons = []) {
  if (!currentSeasonResolution?.activeSeasonStatus) return null;

  if (currentSeasonResolution.activeSeasonStatus === "CURRENT_SEASON_MISSING") {
    return "Es ist keine aktuelle Saison markiert. Trainerzuordnungen fuer Team-Edit koennen derzeit nicht eindeutig geladen werden.";
  }

  if (
    currentSeasonResolution.activeSeasonStatus ===
    "CURRENT_SEASON_AMBIGUOUS"
  ) {
    return "Es sind mehrere aktuelle Saisons markiert. Trainerzuordnungen fuer Team-Edit koennen derzeit nicht eindeutig geladen werden.";
  }

  if (currentTeamSeasons.length === 0) {
    return "Fuer dieses Team existiert in der aktuellen Saison noch keine team_seasons-Zeile. Trainerzuordnungen koennen erst danach eindeutig bearbeitet werden.";
  }

  if (currentTeamSeasons.length > 1) {
    return "Fuer dieses Team existieren mehrere team_seasons-Zeilen in der aktuellen Saison. Trainerzuordnungen koennen derzeit nicht eindeutig geladen werden.";
  }

  return null;
}

export default function AdminTeamsForm({
  team,
  seasons = [],
  teamTemplates = [],
  teamSeasons = [],
  players = [],
  coaches = [],
  playerAssignments = [],
  coachAssignments = [],
  currentSeasonCoachAssignments = [],
  currentSeasonResolution = null,
  currentTeamSeasons = [],
  initialTeamMedia = null,
  initialSeasonMediaByTeamSeasonId = {},
  initialTeamContactMedia = null,
  initialSeasonContactMediaByTeamSeasonId = {},
}) {
  const router = useRouter();
  const initialSeason = useMemo(() => getCurrentSeason(seasons), [seasons]);
  const [activeTab, setActiveTab] = useState("season");
  const [form, setForm] = useState(() =>
    createInitialTeamForm({
      team,
      seasons,
      teamSeasons,
      coaches,
      playerAssignments,
      coachAssignments,
      currentSeasonCoachAssignments,
      seasonId: initialSeason?.id,
    }),
  );
  const [loading, setLoading] = useState(false);
  const initialTeamSeasonId = form.team_season_id;
  const teamMedia = useTeamMedia({ teamId: team?.id, initialMedia: initialTeamMedia, initialSeasonMedia: initialSeasonMediaByTeamSeasonId[initialTeamSeasonId] || null, initialContactMedia: initialTeamContactMedia, initialSeasonContactMedia: initialSeasonContactMediaByTeamSeasonId[initialTeamSeasonId] || null, setForm });
  const isEditMode = Boolean(team?.id);
  const { scopeContext, canAccessTeamInScope, canCreateTeamInScope } =
    useTeamScope();
  const coachStatusMessage = useMemo(
    () => getCoachStatusMessage(currentSeasonResolution, currentTeamSeasons),
    [currentSeasonResolution, currentTeamSeasons],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCoachSelection(nextSelectedIds = []) {
    const selectedIds = new Set(nextSelectedIds);

    setForm((current) => ({
      ...current,
      selected_coach_ids: nextSelectedIds,
      coach_team_state: (current.coach_team_state || []).map((coachItem) => ({
        ...coachItem,
        isAssignedToCurrentTeam: selectedIds.has(coachItem.coach_id),
      })),
    }));
  }

  function updateSeason(seasonId) {
    const season = seasons.find((item) => item.id === seasonId);
    const nextForm = createInitialTeamForm({
      team,
      seasons,
      teamSeasons,
      coaches,
      playerAssignments,
      coachAssignments,
      currentSeasonCoachAssignments,
      seasonId: season?.id,
    });

    teamMedia.resetSeasonMedia(initialSeasonMediaByTeamSeasonId[nextForm.team_season_id] || null, initialSeasonContactMediaByTeamSeasonId[nextForm.team_season_id] || null);

    setForm((current) => ({
      ...nextForm,
      public_season_id: current.public_season_id,
      team_template_id: current.team_template_id,
      team_image_media_asset_id: current.team_image_media_asset_id,
      remove_legacy_team_image: current.remove_legacy_team_image,
      contact_image_media_asset_id: current.contact_image_media_asset_id,
      remove_legacy_contact_image: current.remove_legacy_contact_image,
    }));
  }

  function updateTeamTemplate(templateId) {
    const template = teamTemplates.find((item) => item.id === templateId);

    setForm((current) => ({
      ...current,
      team_template_id: templateId,
      name_de: template?.name_de || "",
      name_en: "",
      slug: template?.slug || "",
      age_group: template?.age_group || "Jugend",
      selected_player_ids: [],
      selected_coach_ids: [],
      coach_team_state: (current.coach_team_state || []).map((coachItem) => ({
        ...coachItem,
        isAssignedToCurrentTeam: false,
      })),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isEditMode && !canAccessTeamInScope(team || {})) {
      alert("Du hast keinen Zugriff auf diese Mannschaft.");
      router.push("/admin/teams");
      return;
    }

    if (!isEditMode && !canCreateTeamInScope(form)) {
      alert("Du darfst diese Mannschaft nicht erstellen.");
      router.push("/admin/teams");
      return;
    }

    if (
      scopeContext?.canAccessYouthAll &&
      !scopeContext?.isGlobal &&
      !isYouthTeam(form)
    ) {
      alert("Mit deinem Scope kannst du nur Jugendmannschaften speichern.");
      return;
    }

    logAdminSaveEvent({
      module: "teams",
      mode: team?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

    if (!form.season_id) {
      alert("Bitte zuerst eine Saison auswaehlen.");
      setActiveTab("season");
      return;
    }

    if (!form.name_de || !form.slug) {
      alert("Bitte zuerst im Reiter Mannschaft eine Mannschaft auswaehlen.");
      setActiveTab("base");
      return;
    }

    setLoading(true);
    const payload = createTeamFormPayload(form);
    const { error } = await saveTeamWithScopeAction(payload, team?.id ?? null);
    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "teams",
        mode: team?.id ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "teams",
      mode: team?.id ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    await revalidatePublicContentAction("teams");
    router.push("/admin/teams");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <TeamFormTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "staff" && coachStatusMessage && (
        <FormAlert tone="warning">{coachStatusMessage}</FormAlert>
      )}

      {activeTab === "season" && (
        <TeamSeasonTab
          seasons={seasons}
          seasonId={form.season_id}
          onSeasonChange={updateSeason}
        />
      )}

      {activeTab === "base" && (
        <TeamBaseTab
          isEditMode={isEditMode}
          form={form}
          teamTemplates={teamTemplates}
          onTeamTemplateChange={updateTeamTemplate}
        />
      )}

      {activeTab === "description" && (
        <TeamDescriptionTab form={form} onFieldChange={updateField} />
      )}
      {activeTab === "training" && (
        <TeamTrainingTab form={form} onFieldChange={updateField} />
      )}
      {activeTab === "players" && (
        <TeamPlayersTab
          items={players}
          selectedIds={form.selected_player_ids}
          onChange={(value) => updateField("selected_player_ids", value)}
          getPersonName={getPersonName}
        />
      )}
      {activeTab === "staff" && (
        <TeamStaffTab
          items={form.coach_team_state || []}
          selectedIds={form.selected_coach_ids}
          onChange={updateCoachSelection}
          getPersonName={getPersonName}
        />
      )}
      {activeTab === "competition" && (
        <TeamCompetitionTab form={form} onFieldChange={updateField} />
      )}
      {activeTab === "contact" && (
        <TeamContactTab
          form={form}
          onFieldChange={updateField}
        />
      )}
      {activeTab === "media" && (
        <TeamMediaTab
          form={form}
          selectedMedia={teamMedia.selectedMedia}
          selectedSeasonMedia={teamMedia.selectedSeasonMedia}
          selectedContactMedia={teamMedia.selectedContactMedia}
          selectedSeasonContactMedia={teamMedia.selectedSeasonContactMedia}
          onMediaChange={teamMedia.handleMediaChange}
          onSeasonMediaChange={teamMedia.handleSeasonMediaChange}
          onContactMediaChange={teamMedia.handleContactMediaChange}
          onSeasonContactMediaChange={teamMedia.handleSeasonContactMediaChange}
          loadMediaAction={teamMedia.loadMediaAction}
          uploadMediaAction={teamMedia.uploadMediaAction}
        />
      )}
      {activeTab === "settings" && (
        <TeamSettingsTab
          form={form}
          seasons={seasons}
          onFieldChange={updateField}
        />
      )}

      <TeamSubmitBar loading={loading} />
    </form>
  );
}
