"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerImageUpload from "../components/PlayerImageUpload";
import { savePlayer, uploadPlayerImage } from "../services/players.service";

export default function AdminPlayersForm({ player, teams = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    year_group: player?.year_group || "",
    strong_foot: player?.strong_foot || "",
    nationality: player?.nationality || "",
    sort_order: player?.sort_order || 0,
    is_active: player?.is_active ?? true,
    is_captain: player?.is_captain ?? false,
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
    setLoading(true);

    console.log("FORM VOR SPEICHERN:", form);
    console.log("PLAYER ID:", player?.id);

    const { data, error } = await savePlayer(form, player?.id ?? null);

    console.log("SUPABASE RESPONSE DATA:", data);
    console.log("SUPABASE RESPONSE ERROR:", error);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/players");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          placeholder="Vorname"
          value={form.first_name}
          onChange={(e) => updateField("first_name", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
          required
        />

        <input
          placeholder="Nachname"
          value={form.last_name}
          onChange={(e) => updateField("last_name", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={form.team_id}
          onChange={(e) => updateField("team_id", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4"
        >
          <option value="">Mannschaft auswählen</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name_de}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Rückennummer"
          value={form.shirt_number}
          onChange={(e) => updateField("shirt_number", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          placeholder="Position Deutsch"
          value={form.position_de}
          onChange={(e) => updateField("position_de", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />

        <input
          placeholder="Position Englisch"
          value={form.position_en}
          onChange={(e) => updateField("position_en", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <input
          type="date"
          value={form.birthdate}
          onChange={(e) => updateField("birthdate", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />

        <input
          placeholder="Jahrgang"
          value={form.year_group}
          onChange={(e) => updateField("year_group", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />

        <input
          placeholder="Starker Fuß"
          value={form.strong_foot}
          onChange={(e) => updateField("strong_foot", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />

        <input
          placeholder="Nationalität"
          value={form.nationality}
          onChange={(e) => updateField("nationality", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />
      </div>

      <textarea
        placeholder="Beschreibung Deutsch"
        rows={5}
        value={form.description_de}
        onChange={(e) => updateField("description_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <textarea
        placeholder="Beschreibung Englisch"
        rows={5}
        value={form.description_en}
        onChange={(e) => updateField("description_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
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
          className="w-32 rounded-2xl border border-white/10 bg-white/5 p-4"
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
