"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CoachImageUpload from "@/components/admin/coaches/components/CoachImageUpload";
import { createSlug } from "../utils/slug";
import { uploadCoachImage, saveCoach } from "../services/coaches.service";

export default function AdminCoachesForm({ coach }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: coach?.name || "",
    slug: coach?.slug || "",
    role: coach?.role || "Trainer",
    email: coach?.email || "",
    phone: coach?.phone || "",
    whatsapp: coach?.whatsapp || "",
    license: coach?.license || "",
    team_name: coach?.team_name || "",
    image_url: coach?.image_url || "",
    sort_order: coach?.sort_order || 0,
    is_active: coach?.is_active ?? true,
  });

  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadCoachImage(file);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const slug = form.slug || createSlug(form.name);

    const payload = {
      ...form,
      slug,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = await saveCoach(payload, coach?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/coaches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        required
      />

      <input
        placeholder="Slug, z. B. swen-verbocket"
        value={form.slug}
        onChange={(e) => updateField("slug", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Funktion, z. B. Trainer oder Co-Trainer"
        value={form.role}
        onChange={(e) => updateField("role", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Mannschaft, z. B. E1 Jugend"
        value={form.team_name}
        onChange={(e) => updateField("team_name", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="E-Mail"
        type="email"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Telefon"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="WhatsApp, z. B. 491701234567"
        value={form.whatsapp}
        onChange={(e) => updateField("whatsapp", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <input
        placeholder="Lizenz, z. B. C-Lizenz"
        value={form.license}
        onChange={(e) => updateField("license", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <CoachImageUpload
        imageUrl={form.image_url}
        onUpload={uploadImage}
        onRemove={() => updateField("image_url", "")}
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

          <span className="font-medium">Trainer aktiv anzeigen</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Speichert..." : "Trainer speichern"}
      </button>
    </form>
  );
}
