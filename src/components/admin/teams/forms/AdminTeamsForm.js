"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActiveStatusField,
  EmailField,
  FormActions,
  FormGrid,
  FormHintBox,
  FormSection,
  InputField,
  PhoneField,
  SelectField,
  SortOrderField,
  TextareaField,
} from "@/components/admin/forms";
import TeamLogoUpload from "../components/TeamLogoUpload";
import TrainingExceptionsManager from "../components/TrainingExceptionsManager";
import TrainingTimesManager from "../components/TrainingTimesManager";
import { createSlug } from "../utils/slug";
import { saveTeamWithSeason, uploadTeamImage } from "../services/teams.service";
import TeamFootballDeFields from "./fields/TeamFootballDeFields";

const TEAM_FORM_TABS = [
  { id: "season", label: "Saison" },
  { id: "base", label: "Mannschaft" },
  { id: "description", label: "Beschreibung" },
  { id: "training", label: "Trainingszeiten" },
  { id: "players", label: "Kader" },
  { id: "staff", label: "Trainer" },
  { id: "competition", label: "Spielbetrieb" },
  { id: "contact", label: "Kontakt" },
  { id: "media", label: "Medien" },
  { id: "settings", label: "Einstellungen" },
];

function getCurrentSeason(seasons = []) {
  return seasons.find((season) => season.is_current) || seasons[0] || null;
}

function findTeamSeason(teamSeasons = [], seasonId) {
  return (
    teamSeasons.find((teamSeason) => teamSeason.season_id === seasonId) || null
  );
}

function getAssignedIds(assignments = [], teamSeasonId, fieldName) {
  if (!teamSeasonId) return [];

  return assignments
    .filter((assignment) => assignment.team_season_id === teamSeasonId)
    .map((assignment) => assignment[fieldName])
    .filter(Boolean);
}

function getPersonName(person = {}) {
  const fullName =
    `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return fullName || person.name || person.name_de || "Ohne Namen";
}

function belongsToTeam(item = {}, teamId) {
  if (!teamId) return true;
  return !item.team_id || item.team_id === teamId;
}

function SelectionList({
  items = [],
  selectedIds = [],
  onChange,
  getLabel,
  getMeta,
  emptyText,
}) {
  function toggleItem(id) {
    const nextValue = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    onChange(nextValue);
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/55">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              isSelected
                ? "border-red-500 bg-red-500/10 text-white"
                : "border-white/10 bg-black/20 text-white/70 hover:border-red-500 hover:text-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                  isSelected
                    ? "border-red-500 bg-red-600 text-white"
                    : "border-white/20"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span>
                <span className="block font-bold">{getLabel(item)}</span>
                {getMeta?.(item) && (
                  <span className="mt-1 block text-xs text-white/45">
                    {getMeta(item)}
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TeamFormTabs({ activeTab, onChange }) {
  return (
    <div className="sticky top-4 z-10 rounded-[2rem] border border-white/10 bg-[#17171d]/95 p-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEAM_FORM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
                isActive
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function createInitialForm({
  team,
  seasons = [],
  teamSeasons = [],
  playerAssignments = [],
  coachAssignments = [],
  seasonId = null,
}) {
  const publicSeason = getCurrentSeason(seasons);
  const selectedSeason =
    seasons.find((season) => season.id === seasonId) || publicSeason;
  const selectedTeamSeason = findTeamSeason(teamSeasons, selectedSeason?.id);
  const source = selectedTeamSeason || team || {};

  return {
    season_id: selectedSeason?.id || "",
    season: selectedSeason?.name || team?.season || "2026/2027",
    public_season_id: publicSeason?.id || selectedSeason?.id || "",
    team_season_id: selectedTeamSeason?.id || "",
    selected_player_ids: getAssignedIds(
      playerAssignments,
      selectedTeamSeason?.id,
      "player_id",
    ),
    selected_coach_ids: getAssignedIds(
      coachAssignments,
      selectedTeamSeason?.id,
      "coach_id",
    ),
    team_template_id: "",
    name_de: source.name_de || team?.name_de || "",
    name_en: source.name_en || team?.name_en || "",
    slug: source.slug || team?.slug || "",
    age_group: source.age_group || team?.age_group || "Jugend",
    description_de: source.description_de || team?.description_de || "",
    description_en: source.description_en || team?.description_en || "",
    training_times_de:
      source.training_times_de || team?.training_times_de || "",
    training_times_en:
      source.training_times_en || team?.training_times_en || "",
    team_image_url: source.team_image_url || team?.team_image_url || "",
    sort_order: source.sort_order ?? team?.sort_order ?? 0,
    is_active: source.is_active ?? team?.is_active ?? true,
    contact_name: source.contact_name || team?.contact_name || "",
    contact_email: source.contact_email || team?.contact_email || "",
    contact_phone: source.contact_phone || team?.contact_phone || "",
    contact_image_url:
      source.contact_image_url || team?.contact_image_url || "",
    fussball_de_matches_widget_code: "",
    fussball_de_table_widget_code: "",
    fussball_de_matches_widget_id:
      source.fussball_de_matches_widget_id ||
      team?.fussball_de_matches_widget_id ||
      "",
    fussball_de_table_widget_id:
      source.fussball_de_table_widget_id ||
      team?.fussball_de_table_widget_id ||
      "",
    fussball_de_team_url:
      source.fussball_de_team_url || team?.fussball_de_team_url || "",
  };
}

export default function AdminTeamsForm({
  team,
  seasons = [],
  teamTemplates = [],
  teamSeasons = [],
  players = [],
  coaches = [],
  playerAssignments = [],
  coachAssignments = [],
}) {
  const router = useRouter();
  const initialSeason = useMemo(() => getCurrentSeason(seasons), [seasons]);
  const [activeTab, setActiveTab] = useState("season");
  const [form, setForm] = useState(() =>
    createInitialForm({
      team,
      seasons,
      teamSeasons,
      playerAssignments,
      coachAssignments,
      seasonId: initialSeason?.id,
    }),
  );
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(team?.id);

  const filteredPlayers = useMemo(
    () => players.filter((player) => belongsToTeam(player, team?.id)),
    [players, team?.id],
  );
  const filteredCoaches = useMemo(
    () => coaches.filter((coach) => belongsToTeam(coach, team?.id)),
    [coaches, team?.id],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSeason(seasonId) {
    const season = seasons.find((item) => item.id === seasonId);
    const nextForm = createInitialForm({
      team,
      seasons,
      teamSeasons,
      playerAssignments,
      coachAssignments,
      seasonId: season?.id,
    });

    setForm((current) => ({
      ...nextForm,
      public_season_id: current.public_season_id,
      team_template_id: current.team_template_id,
    }));
  }

  function updateTeamTemplate(templateId) {
    const template = teamTemplates.find((item) => item.id === templateId);

    setForm((current) => ({
      ...current,
      team_template_id: templateId,
      name_de: template?.name_de || "",
      name_en: "",
      slug: template?.slug || "",
      age_group: template?.age_group || "Jugend",
      selected_player_ids: [],
      selected_coach_ids: [],
    }));
  }

  async function uploadImage(file) {
    const { data, error } = await uploadTeamImage(file, {
      id: team?.id,
      name_de: form.name_de,
      team_image_url: form.team_image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("team_image_url", data);
  }

  async function uploadContactImage(file) {
    const { data, error } = await uploadTeamImage(file, {
      id: team?.id,
      name_de: form.contact_name || form.name_de,
      team_image_url: form.contact_image_url,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("contact_image_url", data);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.season_id) {
      alert("Bitte zuerst eine Saison auswählen.");
      setActiveTab("season");
      return;
    }

    if (!form.name_de || !form.slug) {
      alert("Bitte zuerst im Reiter Mannschaft eine Mannschaft auswählen.");
      setActiveTab("base");
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      contact_phone: form.contact_phone?.replace(/\s/g, "").replace(/\+/g, ""),
      slug: form.slug || createSlug(form.name_de),
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = await saveTeamWithSeason(payload, team?.id ?? null);
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
      <TeamFormTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "season" && (
        <FormSection
          eyebrow="Saison bearbeiten"
          title="Bearbeitungs-Saison auswählen"
          description="Wähle hier nur aus, welche Saison dieser Mannschaft du gerade bearbeiten möchtest. Welche Saison öffentlich angezeigt wird, stellst du unter Einstellungen ein."
        >
          <SelectField
            label="Diese Saison bearbeiten"
            required
            value={form.season_id}
            onChange={(event) => updateSeason(event.target.value)}
          >
            <option value="">Saison auswählen</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.is_current ? " · aktuell öffentlich" : ""}
              </option>
            ))}
          </SelectField>
        </FormSection>
      )}

      {activeTab === "base" && (
        <FormSection
          eyebrow="Mannschaft"
          title="Grunddaten"
          description={
            isEditMode
              ? "Diese Grunddaten werden nur beim Erstellen einer Mannschaft festgelegt und sind danach gesperrt."
              : "Wähle eine Mannschaft aus der Vorlage aus. Slug und Altersgruppe werden automatisch übernommen."
          }
        >
          {isEditMode ? (
            <>
              <FormHintBox eyebrow="Gesperrte Grunddaten">
                Name, Slug und Altersgruppe können nach dem Erstellen nicht mehr
                direkt geändert werden, damit Spieler-, Trainer- und
                Saisonzuordnungen stabil bleiben.
              </FormHintBox>
              <div className="mt-6">
                <FormGrid>
                  <InputField
                    label="Mannschaft"
                    required
                    value={form.name_de}
                    disabled
                  />
                  <InputField label="Slug" value={form.slug} disabled />
                  <InputField
                    label="Altersgruppe"
                    value={form.age_group}
                    disabled
                  />
                  <InputField
                    label="Bearbeitete Saison"
                    value={form.season}
                    disabled
                  />
                </FormGrid>
              </div>
            </>
          ) : (
            <FormGrid>
              <SelectField
                label="Mannschaft auswählen"
                required
                value={form.team_template_id}
                onChange={(event) => updateTeamTemplate(event.target.value)}
              >
                <option value="">Mannschaft auswählen</option>
                {teamTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name_de}
                  </option>
                ))}
              </SelectField>
              <InputField label="Slug" value={form.slug} disabled />
              <InputField
                label="Altersgruppe"
                value={form.age_group}
                disabled
              />
              <InputField
                label="Bearbeitete Saison"
                value={form.season}
                disabled
              />
            </FormGrid>
          )}
        </FormSection>
      )}

      {activeTab === "description" && (
        <FormSection eyebrow="Beschreibung" title="Mannschaftsbeschreibung">
          <div className="space-y-4">
            <TextareaField
              label="Beschreibung Deutsch"
              rows={8}
              value={form.description_de}
              onChange={(event) =>
                updateField("description_de", event.target.value)
              }
            />
            <TextareaField
              label="Beschreibung Englisch"
              rows={8}
              value={form.description_en}
              onChange={(event) =>
                updateField("description_en", event.target.value)
              }
            />
          </div>
        </FormSection>
      )}

      {activeTab === "training" && (
        <FormSection eyebrow="Training" title="Trainingszeiten & Ausnahmen">
          <div className="space-y-8">
            <div className="space-y-4">
              <TextareaField
                label="Trainingszeiten Deutsch"
                rows={5}
                value={form.training_times_de}
                onChange={(event) =>
                  updateField("training_times_de", event.target.value)
                }
              />
              <TextareaField
                label="Trainingszeiten Englisch"
                rows={5}
                value={form.training_times_en}
                onChange={(event) =>
                  updateField("training_times_en", event.target.value)
                }
              />
            </div>

            <TrainingTimesManager teamSeasonId={form.team_season_id} />
            <TrainingExceptionsManager teamSeasonId={form.team_season_id} />
          </div>
        </FormSection>
      )}

      {activeTab === "players" && (
        <FormSection
          eyebrow="Kader"
          title="Spieler dieser Saison"
          description="Angezeigt werden nur Spieler, die bei der Spielererstellung dieser Mannschaft zugeordnet wurden."
        >
          <SelectionList
            items={filteredPlayers}
            selectedIds={form.selected_player_ids}
            onChange={(value) => updateField("selected_player_ids", value)}
            getLabel={getPersonName}
            getMeta={(player) =>
              [player.position_de, player.year_group]
                .filter(Boolean)
                .join(" · ")
            }
            emptyText="Für diese Mannschaft sind noch keine Spieler angelegt oder zugeordnet."
          />
        </FormSection>
      )}

      {activeTab === "staff" && (
        <FormSection
          eyebrow="Team"
          title="Trainer & Betreuer dieser Saison"
          description="Angezeigt werden nur Trainer und Betreuer, die bei der Trainererstellung dieser Mannschaft zugeordnet wurden."
        >
          <SelectionList
            items={filteredCoaches}
            selectedIds={form.selected_coach_ids}
            onChange={(value) => updateField("selected_coach_ids", value)}
            getLabel={getPersonName}
            getMeta={(coach) =>
              [coach.role_de, coach.license].filter(Boolean).join(" · ")
            }
            emptyText="Für diese Mannschaft sind noch keine Trainer oder Betreuer angelegt oder zugeordnet."
          />
        </FormSection>
      )}

      {activeTab === "competition" && (
        <FormSection
          eyebrow="Spielbetrieb"
          title="fussball.de Integration"
          description="Widget-Code aus fussball.de einfügen. Gespeichert werden automatisch nur die Widget-IDs."
        >
          <TeamFootballDeFields form={form} updateField={updateField} />
        </FormSection>
      )}

      {activeTab === "contact" && (
        <FormSection eyebrow="Kontakt" title="Ansprechpartner">
          <div className="space-y-4">
            <InputField
              label="Ansprechpartner"
              value={form.contact_name}
              onChange={(event) =>
                updateField("contact_name", event.target.value)
              }
            />
            <EmailField
              value={form.contact_email}
              onChange={(value) => updateField("contact_email", value)}
            />
            <PhoneField
              value={form.contact_phone}
              onChange={(value) => updateField("contact_phone", value)}
            />
            <TeamLogoUpload
              imageUrl={form.contact_image_url}
              onUpload={uploadContactImage}
              onRemove={() => updateField("contact_image_url", "")}
            />
          </div>
        </FormSection>
      )}

      {activeTab === "media" && (
        <FormSection eyebrow="Medien" title="Mannschaftsbild">
          <TeamLogoUpload
            imageUrl={form.team_image_url}
            onUpload={uploadImage}
            onRemove={() => updateField("team_image_url", "")}
          />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection
          eyebrow="Einstellungen"
          title="Status, Sortierung & öffentliche Saison"
        >
          <div className="space-y-6">
            <FormHintBox eyebrow="Öffentliche Anzeige">
              Diese Auswahl gilt für die komplette Website. Die hier gewählte
              Saison wird auf den öffentlichen Mannschaftsseiten angezeigt.
            </FormHintBox>
            <SelectField
              label="Öffentlich angezeigte Saison"
              value={form.public_season_id}
              onChange={(event) =>
                updateField("public_season_id", event.target.value)
              }
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                  {season.id === form.public_season_id
                    ? " · wird angezeigt"
                    : ""}
                </option>
              ))}
            </SelectField>
            <SortOrderField
              value={form.sort_order}
              onChange={(value) => updateField("sort_order", value)}
            />
            <ActiveStatusField
              checked={form.is_active}
              onChange={(value) => updateField("is_active", value)}
              entityLabel="Mannschaft"
            />
          </div>
        </FormSection>
      )}

      <FormActions
        loading={loading}
        submitLabel="Mannschaft speichern"
        cancelHref="/admin/teams"
      />
    </form>
  );
}
