"use client";
import { SelectField } from "@/components/admin/forms";
export default function NewsCategoryFields({ form, teams = [], categories = [], updateField }) {
  const categoryKey = form.category_key || ""; const isFootball = categoryKey === "fussball";
  function updateCategory(value) { updateField("category_key", value); if (value !== "fussball") updateField("football_team_id", ""); }
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><SelectField label="Kategorie" required value={categoryKey} onChange={(event) => updateCategory(event.target.value)}><option value="">Kategorie auswählen</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name_de}</option>)}</SelectField>{isFootball ? <SelectField label="Fußball-Zuordnung" value={form.football_team_id || ""} onChange={(event) => updateField("football_team_id", event.target.value)}><option value="">Allgemein</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name_de}</option>)}</SelectField> : null}</div>{isFootball ? <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/55">Bei Fußball-News kannst du die Meldung allgemein der Fußballabteilung zuordnen oder direkt einer Mannschaft.</p> : null}</div>;
}
