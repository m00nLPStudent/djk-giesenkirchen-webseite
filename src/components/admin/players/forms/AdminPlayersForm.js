"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerImageUpload from "../components/PlayerImageUpload";
import {
  deletePlayerImage,
  PLAYER_PLACEHOLDER_IMAGE,
  savePlayer,
  uploadPlayerImage,
} from "../services/players.service";
import { getPositionOptions, POSITION_EN } from "./playerForm.config";
import {
  createInitialPlayerForm,
  createPlayerPayload,
  getYearGroupFromBirthdate,
  validatePlayerForm,
} from "./playerForm.helpers";
import PlayerBasicFields from "./fields/PlayerBasicFields";
import PlayerSportFields from "./fields/PlayerSportFields";
import PlayerProfileFields from "./fields/PlayerProfileFields";
import PlayerDescriptionFields from "./fields/PlayerDescriptionFields";
import PlayerSettingsFields from "./fields/PlayerSettingsFields";

export default function AdminPlayersForm({ player, teams = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => createInitialPlayerForm(player));

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === form.team_id),
    [form.team_id, teams],
  );

  const positionOptions = useMemo(
    () => getPositionOptions(selectedTeam?.name_de),
    [selectedTeam?.name_de],
  );

  const calculatedYearGroup = getYearGroupFromBirthdate(form.birthdate);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: null }));
    }
  }

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

  async function uploadImage(file) {
    const { data, error } = await uploadPlayerImage(file, {
      id: player?.id,
      first_name: form.first_name,
      last_name: form.last_name,
      photo_url: form.photo_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("photo_url", data);
  }

  async function removeImage() {
    const { error } = await deletePlayerImage(form.photo_url);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("photo_url", PLAYER_PLACEHOLDER_IMAGE);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validatePlayerForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    const payload = createPlayerPayload(form, calculatedYearGroup);
    const { error } = await savePlayer(payload, player?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/players");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {Object.keys(errors).filter((key) => errors[key]).length > 0 && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-bold">Bitte fülle alle Pflichtfelder aus.</p>
        </div>
      )}

      <PlayerBasicFields
        form={form}
        errors={errors}
        teams={teams}
        updateField={updateField}
      />

      <PlayerSportFields
        form={form}
        errors={errors}
        positionOptions={positionOptions}
        updateField={updateField}
        updatePosition={updatePosition}
      />

      <PlayerProfileFields
        form={form}
        errors={errors}
        calculatedYearGroup={calculatedYearGroup}
        updateField={updateField}
      />

      <PlayerDescriptionFields form={form} updateField={updateField} />

      <PlayerImageUpload
        imageUrl={form.photo_url || PLAYER_PLACEHOLDER_IMAGE}
        placeholderUrl={PLAYER_PLACEHOLDER_IMAGE}
        onUpload={uploadImage}
        onRemove={removeImage}
      />

      <PlayerSettingsFields form={form} updateField={updateField} />

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Speichert..." : "Spieler speichern"}
      </button>
    </form>
  );
}
