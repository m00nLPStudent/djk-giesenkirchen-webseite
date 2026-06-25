"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function createSlug(text) {
  return text
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminTeamsForm({ team }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name_de: team?.name_de || "",
    name_en: team?.name_en || "",
    slug: team?.slug || "",
    age_group: team?.age_group || "Jugend",
    season: team?.season || "2026/2027",
    description_de: team?.description_de || "",
    description_en: team?.description_en || "",
    training_times_de: team?.training_times_de || "",
    training_times_en: team?.training_times_en || "",
    team_image_url: team?.team_image_url || "",
    sort_order: team?.sort_order || 0,
    is_active: team?.is_active ?? true,
    contact_name: team?.contact_name || "",
    contact_email: team?.contact_email || "",
    contact_phone: team?.contact_phone || "",
    contact_image_url: team?.contact_image_url || "",
  });

  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(file) {
    if (!file) return;

    const fileName = `teams/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(fileName);

    updateField("team_image_url", data.publicUrl);
  }

  async function uploadContactImage(file) {
    if (!file) return;

    const fileName = `contacts/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(fileName);

    updateField("contact_image_url", data.publicUrl);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const cleanPhone = form.contact_phone
      ?.replace(/\s/g, "")
      .replace(/\+/g, "");

    const slug = form.slug || createSlug(form.name_de);

    const payload = {
      ...form,
      contact_phone: cleanPhone,
      slug,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = team?.id
      ? await supabase.from("teams").update(payload).eq("id", team.id)
      : await supabase.from("teams").insert(payload);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/teams");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <input
        placeholder="Name Deutsch"
        value={form.name_de}
        onChange={(e) => updateField("name_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        required
      />

      <input
        placeholder="Name Englisch"
        value={form.name_en}
        onChange={(e) => updateField("name_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Slug, z. B. e1"
        value={form.slug}
        onChange={(e) => updateField("slug", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Altersgruppe, z. B. Jugend oder Senioren"
        value={form.age_group}
        onChange={(e) => updateField("age_group", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Saison"
        value={form.season}
        onChange={(e) => updateField("season", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

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

      <textarea
        placeholder="Trainingszeiten Deutsch"
        rows={3}
        value={form.training_times_de}
        onChange={(e) => updateField("training_times_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <textarea
        placeholder="Trainingszeiten Englisch"
        rows={3}
        value={form.training_times_en}
        onChange={(e) => updateField("training_times_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-black">Kontakt</h2>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Ansprechpartner"
            value={form.contact_name}
            onChange={(e) => updateField("contact_name", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
          />

          <input
            placeholder="E-Mail"
            type="email"
            value={form.contact_email}
            onChange={(e) => updateField("contact_email", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
          />

          <input
            placeholder="Handynummer, z. B. 491701234567"
            value={form.contact_phone}
            onChange={(e) => updateField("contact_phone", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
            Ansprechpartner Bild
          </label>

          <label className="inline-flex cursor-pointer items-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700">
            Bild auswählen
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadContactImage(e.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
        {form.contact_image_url && (
          <div className="mt-4">
            <div className="mb-3 flex items-center gap-4">
              <img
                src={form.contact_image_url}
                alt="Ansprechpartner"
                className="h-24 w-24 rounded-full border border-white/10 object-cover"
              />

              <button
                type="button"
                onClick={() => updateField("contact_image_url", "")}
                className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10"
              >
                Bild entfernen
              </button>
            </div>
          </div>
        )}

        <p className="mt-3 text-sm text-white/40">
          Für WhatsApp bitte die Nummer im internationalen Format ohne +
          eintragen, z. B. 491701234567.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Mannschaftsbild
        </label>

        <label className="inline-flex cursor-pointer items-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-700">
          Bild auswählen
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadImage(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>

      {form.team_image_url && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Bildvorschau
            </p>

            <button
              type="button"
              onClick={() => updateField("team_image_url", "")}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10"
            >
              Bild entfernen
            </button>
          </div>

          <img
            src={form.team_image_url}
            alt="Mannschaftsbild"
            className="max-h-72 w-full rounded-xl object-contain"
          />
        </div>
      )}

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

        <p className="mt-2 text-sm text-white/40">
          Kleinere Zahl = weiter oben anzeigen
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
          />

          <span className="font-medium">Mannschaft aktiv anzeigen</span>
        </label>

        <p className="mt-2 text-sm text-white/40">
          Deaktivierte Mannschaften erscheinen nicht auf der Webseite.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Speichert..." : "Mannschaft speichern"}
      </button>
    </form>
  );
}
