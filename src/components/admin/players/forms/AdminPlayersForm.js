"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerImageUpload from "../components/PlayerImageUpload";
import { savePlayer, uploadPlayerImage } from "../services/players.service";
import {
  ADVANCED_POSITIONS,
  COUNTRIES,
  SIMPLE_POSITIONS,
  STRONG_FOOT,
} from "@/constants";

const POSITION_EN = {
  Torwart: "Goalkeeper",
  Abwehr: "Defence",
  Mittelfeld: "Midfield",
  Angriff: "Attack",
  Innenverteidiger: "Centre-back",
  Außenverteidiger: "Full-back",
  "Defensives Mittelfeld": "Defensive midfield",
  "Zentrales Mittelfeld": "Central midfield",
  "Offensives Mittelfeld": "Attacking midfield",
  "Linkes Mittelfeld": "Left midfield",
  "Rechtes Mittelfeld": "Right midfield",
  Linksaußen: "Left winger",
  Rechtsaußen: "Right winger",
  Mittelstürmer: "Centre forward",
};

function usesSimplePositions(teamName = "") {
  const name = teamName.toLowerCase();

  return (
    name.includes("bambini") ||
    name.includes("f-jugend") ||
    name.includes("f1") ||
    name.includes("f2") ||
    name.includes("e-jugend") ||
    name.includes("e1") ||
    name.includes("e2")
  );
}

function getYearGroupFromBirthdate(birthdate) {
  if (!birthdate) return "";
  return String(new Date(birthdate).getFullYear());
}

const germany = COUNTRIES.find((country) => country.iso === "DE");
const countryOptions = germany
  ? [germany, ...COUNTRIES.filter((country) => country.iso !== "DE")]
  : COUNTRIES;

const requiredFields = {
  team_id: "Mannschaft",
  first_name: "Vorname",
  last_name: "Nachname",
  birthdate: "Geburtsdatum",
  position_de: "Position",
  nationality: "Nationalität",
};

export default function AdminPlayersForm({ player, teams = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    team_id: player?.team_id || "",
    first_name: player?.first_name || "",
    last_name: player?.last_name || "",
    shirt_number: player?.shirt_number || "",
    position_de: player?.position_de || "",
    position_en: player?.position_en || "",
    photo_url: player?.photo_url || "",
    description_de: player?.description_de || "",
    description_en: player?.description_en || "",
    birthdate: player?.birthdate || "",
    strong_foot: player?.strong_foot || "",
    nationality: player?.nationality || "",
    sort_order: player?.sort_order || 0,
    is_active: player?.is_active ?? true,
    is_captain: player?.is_captain ?? false,
  });

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === form.team_id),
    [form.team_id, teams],
  );

  const positionOptions = usesSimplePositions(selectedTeam?.name_de)
    ? SIMPLE_POSITIONS
    : ADVANCED_POSITIONS;

  const calculatedYearGroup = getYearGroupFromBirthdate(form.birthdate);

  function validate(currentForm) {
    const nextErrors = {};

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!String(currentForm[field] || "").trim()) {
        nextErrors[field] = `${label} ist ein Pflichtfeld.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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
    const { data, error } = await uploadPlayerImage(file, "players");

    if (error) {
      alert(error.message);
      return;
    }

    updateField("photo_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate(form)) {
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      year_group: calculatedYearGroup,
    };

    const { error } = await savePlayer(payload, player?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/players");
    router.refresh();
  }

  function fieldClass(field) {
    return `w-full rounded-2xl border bg-white/5 p-4 ${
      errors[field]
        ? "border-red-500 outline-none"
        : "border-white/10 outline-none focus:border-red-500"
    }`;
  }

  function selectClass(field) {
    return `w-full rounded-2xl border bg-[#17171d] p-4 ${
      errors[field]
        ? "border-red-500 outline-none"
        : "border-white/10 outline-none focus:border-red-500"
    }`;
  }

  function ErrorText({ field }) {
    if (!errors[field]) return null;
    return <p className="mt-2 text-sm font-medium text-red-400">{errors[field]}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {Object.keys(errors).filter((key) => errors[key]).length > 0 && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-bold">Bitte fülle alle Pflichtfelder aus.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            placeholder="Vorname *"
            value={form.first_name}
            onChange={(e) => updateField("first_name", e.target.value)}
            className={fieldClass("first_name")}
          />
          <ErrorText field="first_name" />
        </div>

        <div>
          <input
            placeholder="Nachname *"
            value={form.last_name}
            onChange={(e) => updateField("last_name", e.target.value)}
            className={fieldClass("last_name")}
          />
          <ErrorText field="last_name" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <select
            value={form.team_id}
            onChange={(e) => updateField("team_id", e.target.value)}
            className={selectClass("team_id")}
          >
            <option value="">Mannschaft auswählen *</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name_de}
              </option>
            ))}
          </select>
          <ErrorText field="team_id" />
        </div>

        <input
          type="number"
          placeholder="Rückennummer"
          value={form.shirt_number}
          onChange={(e) => updateField("shirt_number", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <select
            value={form.position_de}
            onChange={(e) => updatePosition(e.target.value)}
            className={selectClass("position_de")}
          >
            <option value="">Position auswählen *</option>
            {positionOptions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          <ErrorText field="position_de" />
        </div>

        <input
          placeholder="Position Englisch"
          value={form.position_en}
          onChange={(e) => updateField("position_en", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <input
            type="date"
            value={form.birthdate}
            onChange={(e) => updateField("birthdate", e.target.value)}
            className={fieldClass("birthdate")}
          />
          <ErrorText field="birthdate" />
          {calculatedYearGroup && (
            <p className="mt-2 text-sm text-white/40">
              Jahrgang: {calculatedYearGroup}
            </p>
          )}
        </div>

        <select
          value={form.strong_foot}
          onChange={(e) => updateField("strong_foot", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 outline-none focus:border-red-500"
        >
          <option value="">Starker Fuß auswählen</option>
          {STRONG_FOOT.map((foot) => (
            <option key={foot} value={foot}>
              {foot}
            </option>
          ))}
        </select>

        <div className="md:col-span-2">
          <select
            value={form.nationality}
            onChange={(e) => updateField("nationality", e.target.value)}
            className={selectClass("nationality")}
          >
            <option value="">Nationalität auswählen *</option>
            {countryOptions.map((country) => (
              <option key={country.iso} value={country.iso}>
                {country.flag} {country.de}
              </option>
            ))}
          </select>
          <ErrorText field="nationality" />
        </div>
      </div>

      <textarea
        placeholder="Beschreibung Deutsch"
        rows={5}
        value={form.description_de}
        onChange={(e) => updateField("description_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500"
      />

      <textarea
        placeholder="Beschreibung Englisch"
        rows={5}
        value={form.description_en}
        onChange={(e) => updateField("description_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500"
      />

      <PlayerImageUpload
        imageUrl={form.photo_url}
        onUpload={uploadImage}
        onRemove={() => updateField("photo_url", "")}
      />

      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Reihenfolge
        </label>

        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => updateField("sort_order", e.target.value)}
          className="w-32 rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
            className="mr-3"
          />
          Spieler aktiv anzeigen
        </label>

        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium">
          <input
            type="checkbox"
            checked={form.is_captain}
            onChange={(e) => updateField("is_captain", e.target.checked)}
            className="mr-3"
          />
          Spielführer
        </label>
      </div>

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
