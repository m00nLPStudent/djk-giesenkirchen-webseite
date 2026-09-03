"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPlayerMediaPickerAction, savePlayerWithScopeAction, uploadPlayerMediaAction } from "@/app/admin/players/actions";
import { FormAlert, FormSection } from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import useEntityForm from "@/components/admin/hooks/useEntityForm";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import { REQUIRED_FIELDS_MESSAGE } from "@/components/admin/utils/validation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import { PLAYER_PLACEHOLDER_IMAGE } from "../services/players.service";
import { getPositionOptions } from "./playerForm.config";
import {
  createInitialPlayerForm,
  createPlayerPayload,
  getYearGroupFromBirthdate,
  getPlayerFormBlockingMessage,
  getPlayerFormWarningMessage,
  validatePlayerForm,
} from "./playerForm.helpers";
import PlayerBasicFields from "./fields/PlayerBasicFields";
import PlayerSportFields from "./fields/PlayerSportFields";
import PlayerProfileFields from "./fields/PlayerProfileFields";
import PlayerDescriptionFields from "./fields/PlayerDescriptionFields";
import PlayerSettingsFields from "./fields/PlayerSettingsFields";

const PLAYER_FORM_TABS = [
  { id: "basic", label: "Grunddaten" },
  { id: "sport", label: "Sport" },
  { id: "profile", label: "Profil" },
  { id: "description", label: "Beschreibung" },
  { id: "media", label: "Medien" },
  { id: "settings", label: "Einstellungen" },
];

export default function AdminPlayersForm({
  player,
  teamOptionsResult,
  playerSeasonalReadModel,
  sportContext = "football",
  returnPath = "/admin/players",
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedMedia, setSelectedMedia] = useState(player?.mediaAsset || null);
  const teamOptions = useMemo(
    () => teamOptionsResult?.teamOptions || [],
    [teamOptionsResult?.teamOptions],
  );
  const {
    form,
    setForm,
    errors,
    setErrors,
    loading,
    setLoading,
    updateField,
    validateForm,
    hasErrors,
  } = useEntityForm({
    initialForm: createInitialPlayerForm(player, playerSeasonalReadModel),
    validate: (nextForm) => {
      const option = teamOptions.find((item) => item.teamSeasonId === nextForm.team_season_id);
      const relation = option?.team?.departments;
      const slug = Array.isArray(relation) ? relation[0]?.slug : relation?.slug;
      const validationContext = sportContext === "global"
        ? (slug === "tischtennis" ? "table_tennis" : "football")
        : sportContext;
      return validatePlayerForm(nextForm, validationContext);
    },
  });

  const blockingMessage = getPlayerFormBlockingMessage(
    teamOptionsResult,
    playerSeasonalReadModel,
  );
  const warningMessage = getPlayerFormWarningMessage(playerSeasonalReadModel);

  const selectedTeam = useMemo(
    () =>
      teamOptions.find(
        (teamOption) => teamOption.teamSeasonId === form.team_season_id,
      ),
    [form.team_season_id, teamOptions],
  );
  const selectedTeamRelation = selectedTeam?.team?.departments;
  const selectedDepartmentSlug = Array.isArray(selectedTeamRelation)
    ? selectedTeamRelation[0]?.slug
    : selectedTeamRelation?.slug;
  const effectiveSportContext = sportContext === "global"
    ? (selectedDepartmentSlug === "tischtennis" ? "table_tennis" : "football")
    : sportContext;

  const positionOptions = useMemo(
    () => getPositionOptions(selectedTeam?.teamNameDe),
    [selectedTeam?.teamNameDe],
  );

  const calculatedYearGroup = getYearGroupFromBirthdate(form.birthdate);

  function updatePosition(value) {
    setForm((current) => ({
      ...current,
      position_de: value,
    }));

    if (errors.position_de) {
      setErrors((current) => ({ ...current, position_de: null }));
    }
  }

  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({ ...current, image_media_asset_id: media?.id || null, image_url: media?.previewUrl || (media ? current.image_url : null) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (blockingMessage) {
      setActiveTab("basic");
      alert(blockingMessage);
      return;
    }

    logAdminSaveEvent({
      module: "players",
      mode: player?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const payload = createPlayerPayload(form, calculatedYearGroup);
    const { error } = await savePlayerWithScopeAction(
      payload,
      player?.id ?? null,
      { departmentSlug: sportContext === "global" ? null : sportContext === "table_tennis" ? "tischtennis" : "fussball" },
    );

    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "players",
        mode: player?.id ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "players",
      mode: player?.id ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    router.push(returnPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      <TabNavigation
        tabs={effectiveSportContext === "table_tennis" ? PLAYER_FORM_TABS.filter((tab) => tab.id !== "sport") : PLAYER_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {blockingMessage && <FormAlert>{blockingMessage}</FormAlert>}
      {!blockingMessage && warningMessage && (
        <FormAlert tone="warning">{warningMessage}</FormAlert>
      )}
      {hasErrors && <FormAlert>{REQUIRED_FIELDS_MESSAGE}</FormAlert>}

      {activeTab === "basic" && (
        <FormSection
          eyebrow="Spieler"
          title="Persönliche Daten"
          description={effectiveSportContext === "table_tennis"
            ? "Grunddaten und Mannschaftszuordnung des Spielers."
            : "Grunddaten, Mannschaftszuordnung und Rückennummer des Spielers."}
        >
          <PlayerBasicFields
            form={form}
            errors={errors}
            teamOptions={teamOptions}
            updateField={updateField}
            sportContext={effectiveSportContext}
          />
        </FormSection>
      )}

      {activeTab === "sport" && effectiveSportContext !== "table_tennis" && (
        <FormSection
          eyebrow="Sport"
          title="Sportliche Angaben"
          description="Position, englische Positionsbezeichnung und sportliche Zusatzinformationen."
        >
          <PlayerSportFields
            form={form}
            errors={errors}
            positionOptions={positionOptions}
            updateField={updateField}
            sportContext={effectiveSportContext}
            updatePosition={updatePosition}
          />
        </FormSection>
      )}

      {activeTab === "profile" && (
        <FormSection
          eyebrow="Profil"
          title="Profilangaben"
          description="Geburtsdatum, Jahrgang, Geschlecht, Nationalität und Vereinszugehörigkeit."
        >
          <PlayerProfileFields
            form={form}
            errors={errors}
            calculatedYearGroup={calculatedYearGroup}
            updateField={updateField}
            sportContext={effectiveSportContext}
          />
        </FormSection>
      )}

      {activeTab === "description" && (
        <FormSection
          eyebrow="Beschreibung"
          title="Spielerbeschreibung"
          description="Optionale Texte für interne oder öffentliche Darstellungen."
        >
          <PlayerDescriptionFields form={form} updateField={updateField} />
        </FormSection>
      )}

      {activeTab === "media" && (
        <FormSection
          eyebrow="Medien"
          title="Spielerbild"
          description="Das Bild wird in der Verwaltung, Mannschaftsübersicht und Spielerprofilseite verwendet."
        >
          <AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia ? null : form.image_url} placeholderUrl={PLAYER_PLACEHOLDER_IMAGE} onChange={handleMediaChange} loadAction={(filters) => loadPlayerMediaPickerAction(filters, player?.id || null)} uploadAction={(data) => uploadPlayerMediaAction(data, player?.id || null)} usageContext="player" entityLabel="Spielerbild" />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection eyebrow="Einstellungen" title="Status & Sortierung">
          <PlayerSettingsFields form={form} updateField={updateField} />
        </FormSection>
      )}

      <AdminSaveBar
        loading={loading}
        submitLabel="Spieler speichern"
        cancelHref={returnPath}
      />
    </form>
  );
}
