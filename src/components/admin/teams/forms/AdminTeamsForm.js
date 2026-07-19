"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveTeamWithScopeAction } from "@/app/admin/teams/actions";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import { uploadTeamImage } from "../services/teams.service";
import TeamFormTabs from "./components/TeamFormTabs";
import TeamSubmitBar from "./components/TeamSubmitBar";
import { createInitialTeamForm } from "./helpers/teamFormInitialState";
import { createTeamFormPayload } from "./helpers/teamFormPayload";
import {
  belongsToTeam,
  getCurrentSeason,
  getPersonName,
} from "./helpers/teamFormOptions";
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

export default function AdminTeamsForm({
  team,
  seasons = [],
  teamTemplates = [],
  teamSeasons = [],
  players = [],
  coaches = [],
  playerAssignments = [],
  coachAssignments = [],
}) {
  const router = useRouter();
  const initialSeason = useMemo(() => getCurrentSeason(seasons), [seasons]);
  const [activeTab, setActiveTab] = useState("season");
  const [form, setForm] = useState(() =>
    createInitialTeamForm({
      team,
      seasons,
      teamSeasons,
      playerAssignments,
      coachAssignments,
      seasonId: initialSeason?.id,
    }),
  );
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(team?.id);
  const { scopeContext, canAccessTeamInScope, canCreateTeamInScope } =
    useTeamScope();

  const filteredPlayers = useMemo(
    () => players.filter((player) => belongsToTeam(player, team?.id)),
    [players, team?.id],
  );
  const filteredCoaches = useMemo(
    () => coaches.filter((coach) => belongsToTeam(coach, team?.id)),
    [coaches, team?.id],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSeason(seasonId) {
    const season = seasons.find((item) => item.id === seasonId);
    const nextForm = createInitialTeamForm({
      team,
      seasons,
      teamSeasons,
      playerAssignments,
      coachAssignments,
      seasonId: season?.id,
    });

    setForm((current) => ({
      ...nextForm,
      public_season_id: current.public_season_id,
      team_template_id: current.team_template_id,
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
    }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadTeamImage(file, {
      id: team?.id,
      name_de: form.name_de,
      team_image_url: form.team_image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("team_image_url", data);
  }

  async function uploadContactImage(file) {
    const { data, error } = await uploadTeamImage(file, {
      id: team?.id,
      name_de: form.contact_name || form.name_de,
      team_image_url: form.contact_image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("contact_image_url", data);
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
      alert("Bitte zuerst eine Saison auswählen.");
      setActiveTab("season");
      return;
    }

    if (!form.name_de || !form.slug) {
      alert("Bitte zuerst im Reiter Mannschaft eine Mannschaft auswählen.");
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
          items={filteredPlayers}
          selectedIds={form.selected_player_ids}
          onChange={(value) => updateField("selected_player_ids", value)}
          getPersonName={getPersonName}
        />
      )}

      {activeTab === "staff" && (
        <TeamStaffTab
          items={filteredCoaches}
          selectedIds={form.selected_coach_ids}
          onChange={(value) => updateField("selected_coach_ids", value)}
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
          onUploadContactImage={uploadContactImage}
        />
      )}

      {activeTab === "media" && (
        <TeamMediaTab
          form={form}
          onFieldChange={updateField}
          onUploadImage={uploadImage}
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
