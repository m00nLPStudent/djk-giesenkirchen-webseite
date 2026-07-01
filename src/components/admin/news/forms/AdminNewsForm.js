"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NewsImageUpload from "../components/NewsImageUpload";
import { createSlug } from "../utils/slug";
import { uploadNewsImage, createNews } from "../services/news.service";
import NewsCategoryFields from "./NewsCategoryFields";

export default function AdminNewsForm({ teams = [] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title_de: "",
    title_en: "",
    teaser_de: "",
    teaser_en: "",
    content_de: "",
    content_en: "",
    category: "Verein",
    category_key: "verein",
    football_team_id: "",
    image_url: "",
    is_published: true,
    published_at: "",
  });

  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadNewsImage(file);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const slug = createSlug(form.title_de);

    const publishedAt = form.is_published
      ? form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString()
      : null;

    const { error } = await createNews({
      ...form,
      slug,
      author: "DJK/VfL Giesenkirchen",
      football_team_id: form.category_key === "fussball" ? form.football_team_id || null : null,
      is_published: form.is_published,
      published_at: publishedAt,
    });

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/news");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <input
        placeholder="Titel Deutsch"
        value={form.title_de}
        onChange={(e) => updateField("title_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        required
      />

      <input
        placeholder="Titel Englisch"
        value={form.title_en}
        onChange={(e) => updateField("title_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <NewsCategoryFields form={form} teams={teams} updateField={updateField} />

      <textarea
        placeholder="Teaser Deutsch"
        rows={3}
        value={form.teaser_de}
        onChange={(e) => updateField("teaser_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <textarea
        placeholder="Teaser Englisch"
        rows={3}
        value={form.teaser_en}
        onChange={(e) => updateField("teaser_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <textarea
        placeholder="Inhalt Deutsch"
        rows={8}
        value={form.content_de}
        onChange={(e) => updateField("content_de", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <textarea
        placeholder="Inhalt Englisch"
        rows={8}
        value={form.content_en}
        onChange={(e) => updateField("content_en", e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
      />

      <NewsImageUpload
        imageUrl={form.image_url}
        onUpload={uploadImage}
        onRemove={() => updateField("image_url", "")}
      />

      <label className="flex items-center gap-3 text-white/70">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => updateField("is_published", e.target.checked)}
        />
        Zur Veröffentlichung freigeben
      </label>

      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Veröffentlichungsdatum
        </label>

        <input
          type="datetime-local"
          value={form.published_at}
          onChange={(e) => updateField("published_at", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4"
        />

        <p className="mt-2 text-sm text-white/40">
          Leer lassen = direkte Veröffentlichung. Datum in der Zukunft = geplante Veröffentlichung.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 font-bold disabled:opacity-50"
      >
        {loading ? "Speichert..." : "News speichern"}
      </button>
    </form>
  );
}
