"use client";

import { SelectField } from "@/components/admin/forms";

const NEWS_CATEGORIES = [
  { key: "allgemein", label: "Allgemein" },
  { key: "verein", label: "Verein" },
  { key: "fussball", label: "Fußball" },
  { key: "tischtennis", label: "Tischtennis" },
  { key: "damen-gymnastik", label: "Damen-Gymnastik" },
  { key: "testessen", label: "Testessen" },
  { key: "sonstiges", label: "Sonstiges" },
];

export function getCategoryLabel(key) {
  return NEWS_CATEGORIES.find((category) => category.key === key)?.label || "Allgemein";
}

export function getCategoryKeyFromLabel(label = "") {
  const normalizedLabel = String(label).trim().toLowerCase();

  return (
    NEWS_CATEGORIES.find((category) => category.label.toLowerCase() === normalizedLabel)?.key ||
    "allgemein"
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
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Kategorie"
          value={categoryKey}
          onChange={(event) => updateCategory(event.target.value)}
        >
          {NEWS_CATEGORIES.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </SelectField>

        {isFootball && (
          <SelectField
            label="Fußball-Zuordnung"
            value={form.football_team_id || ""}
            onChange={(event) => updateField("football_team_id", event.target.value)}
          >
            <option value="">Allgemein</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name_de}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      {isFootball && (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/55">
          Bei Fußball-News kannst du die Meldung allgemein der Fußballabteilung zuordnen oder direkt einer Mannschaft.
        </p>
      )}
    </div>
  );
}
