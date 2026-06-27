"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerImageUpload from "../components/PlayerImageUpload";
import { savePlayer, uploadPlayerImage } from "../services/players.service";

export default function AdminPlayersForm({ player, teams = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: player?.first_name || "",
    last_name: player?.last_name || "",
    name_de: player?.name_de || "",
    team_id: player?.team_id || "",
    jersey_number: player?.jersey_number || "",
    position: player?.position || "",
    year_group: player?.year_group || "",
    strong_foot: player?.strong_foot || "",
    image_url: player?.image_url || "",
    description_de: player?.description_de || "",
    sort_order: player?.sort_order || 0,
    is_active: player?.is_active ?? true,
    is_captain: player?.is_captain ?? false,
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadPlayerImage(file, "players");
    if (error) {
      alert(error.message);
      return;
    }
    updateField("image_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const fullName = (form.first_name + " " + form.last_name).trim();
    const payload = {
      ...form,
      name_de: form.name_de || fullName,
      team_id: form.team_id || null,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      sort_order: Number(form.sort_order),
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

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input placeholder="Vorname" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" required />
        <input placeholder="Nachname" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" required />
      </div>

      <input placeholder="Anzeigename optional" value={form.name_de} onChange={(e) => updateField("name_de", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />

      <div className="grid gap-4 md:grid-cols-2">
        <select value={form.team_id} onChange={(e) => updateField("team_id", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4">
          <option value="">Mannschaft auswählen</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name_de}</option>)}
        </select>
        <input type="number" placeholder="Rückennummer" value={form.jersey_number} onChange={(e) => updateField("jersey_number", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input placeholder="Position" value={form.position} onChange={(e) => updateField("position", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />
        <input placeholder="Jahrgang" value={form.year_group} onChange={(e) => updateField("year_group", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />
        <input placeholder="Starker Fuß" value={form.strong_foot} onChange={(e) => updateField("strong_foot", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />
      </div>

      <textarea placeholder="Beschreibung" rows={5} value={form.description_de} onChange={(e) => updateField("description_de", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4" />

      <PlayerImageUpload imageUrl={form.image_url} onUpload={uploadImage} onRemove={() => updateField("image_url", "")} />

      <input type="number" value={form.sort_order} onChange={(e) => updateField("sort_order", e.target.value)} className="w-32 rounded-2xl border border-white/10 bg-white/5 p-4" />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="mr-3" />Spieler aktiv anzeigen</label>
        <label className="rounded-2xl border border-white/10 bg-white/5 p-4 font-medium"><input type="checkbox" checked={form.is_captain} onChange={(e) => updateField("is_captain", e.target.checked)} className="mr-3" />Spielführer</label>
      </div>

      <button type="submit" disabled={loading} className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50">{loading ? "Speichert..." : "Spieler speichern"}</button>
    </form>
  );
}
