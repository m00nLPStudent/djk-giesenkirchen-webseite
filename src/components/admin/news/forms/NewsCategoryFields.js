"use client";

const NEWS_CATEGORIES = [
  { key: "verein", label: "Verein" },
  { key: "fussball", label: "Fußball" },
  { key: "tischtennis", label: "Tischtennis" },
  { key: "damen-gymnastik", label: "Damen-Gymnastik" },
  { key: "allgemein", label: "Allgemein" },
  { key: "sonstiges", label: "Sonstiges" },
];

export function getCategoryLabel(key) {
  return NEWS_CATEGORIES.find((category) => category.key === key)?.label || "Verein";
}

export function getCategoryKeyFromLabel(label = "") {
  const normalizedLabel = String(label).trim().toLowerCase();

  return (
    NEWS_CATEGORIES.find((category) => category.label.toLowerCase() === normalizedLabel)?.key ||
    "verein"
  );
}

export default function NewsCategoryFields({ form, teams = [], updateField }) {
  const categoryKey = form.category_key || getCategoryKeyFromLabel(form.category);
  const isFootball = categoryKey === "fussball";

  function updateCategory(value) {
    updateField("category_key", value);
    updateField("category", getCategoryLabel(value));

    if (value !== "fussball") {
      updateField("football_team_id", "");
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          Kategorie
        </label>
        <select
          value={categoryKey}
          onChange={(event) => updateCategory(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          {NEWS_CATEGORIES.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {isFootball && (
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.25em] text-white/60">
            Fußball-Zuordnung
          </label>
          <select
            value={form.football_team_id || ""}
            onChange={(event) => updateField("football_team_id", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
          >
            <option value="">Allgemein</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name_de}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
