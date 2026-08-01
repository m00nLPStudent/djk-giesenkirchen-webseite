"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { savePlayerWithScopeAction } from "@/app/admin/players/actions";
import { FormAlert, FormSection } from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import useEntityForm from "@/components/admin/hooks/useEntityForm";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import { REQUIRED_FIELDS_MESSAGE } from "@/components/admin/utils/validation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import PlayerImageUpload from "../components/PlayerImageUpload";
import {
  deletePlayerImage,
  PLAYER_PLACEHOLDER_IMAGE,
  uploadPlayerImage,
} from "../services/players.service";
import { getPositionOptions, POSITION_EN } from "./playerForm.config";
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
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
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
    validate: validatePlayerForm,
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

  const positionOptions = useMemo(
    () => getPositionOptions(selectedTeam?.teamNameDe),
    [selectedTeam?.teamNameDe],
  );

  const calculatedYearGroup = getYearGroupFromBirthdate(form.birthdate);

  function updatePosition(value) {
    setForm((current) => ({
      ...current,
      position_de: value,
      position_en: POSITION_EN[value] || value,
    }));

    if (errors.position_de) {
      setErrors((current) => ({ ...current, position_de: null }));
    }
  }

  const { uploadImage, removeImage } = useImageUpload({
    currentUrl: form.image_url,
    placeholderUrl: PLAYER_PLACEHOLDER_IMAGE,
    uploadAction: uploadPlayerImage,
    deleteAction: deletePlayerImage,
    onChange: (url) => updateField("image_url", url),
    getUploadContext: () => ({
      id: player?.id,
      first_name: form.first_name,
      last_name: form.last_name,
      image_url: form.image_url,
    }),
  });

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

    router.push("/admin/players");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      <TabNavigation
        tabs={PLAYER_FORM_TABS}
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
          description="Grunddaten, Mannschaftszuordnung und Rückennummer des Spielers."
        >
          <PlayerBasicFields
            form={form}
            errors={errors}
            teamOptions={teamOptions}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "sport" && (
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
          <PlayerImageUpload
            imageUrl={form.image_url || PLAYER_PLACEHOLDER_IMAGE}
            placeholderUrl={PLAYER_PLACEHOLDER_IMAGE}
            onUpload={uploadImage}
            onRemove={removeImage}
          />
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
        cancelHref="/admin/players"
      />
    </form>
  );
}
