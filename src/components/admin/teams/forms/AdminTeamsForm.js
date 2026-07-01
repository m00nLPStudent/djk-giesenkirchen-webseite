"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActiveStatusField,
  EmailField,
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  PhoneField,
  SelectField,
  SortOrderField,
  TextareaField,
} from "@/components/admin/forms";
import TeamLogoUpload from "../components/TeamLogoUpload";
import { createSlug } from "../utils/slug";
import { uploadTeamImage, saveTeamWithSeason } from "../services/teams.service";
import TeamFootballDeFields from "./fields/TeamFootballDeFields";

function getCurrentSeason(seasons = []) {
  return seasons.find((season) => season.is_current) || seasons[0] || null;
}

function findTeamSeason(teamSeasons = [], seasonId) {
  return teamSeasons.find((teamSeason) => teamSeason.season_id === seasonId) || null;
}

function createInitialForm(team, seasons = [], teamSeasons = [], seasonId = null) {
  const selectedSeason = seasons.find((season) => season.id === seasonId) || getCurrentSeason(seasons);
  const selectedTeamSeason = findTeamSeason(teamSeasons, selectedSeason?.id);
  const source = selectedTeamSeason || team || {};

  return {
    season_id: selectedSeason?.id || "",
    season: selectedSeason?.name || team?.season || "2026/2027",
    name_de: source.name_de || team?.name_de || "",
    name_en: source.name_en || team?.name_en || "",
    slug: source.slug || team?.slug || "",
    age_group: source.age_group || team?.age_group || "Jugend",
    description_de: source.description_de || team?.description_de || "",
    description_en: source.description_en || team?.description_en || "",
    training_times_de: source.training_times_de || team?.training_times_de || "",
    training_times_en: source.training_times_en || team?.training_times_en || "",
    team_image_url: source.team_image_url || team?.team_image_url || "",
    sort_order: source.sort_order ?? team?.sort_order ?? 0,
    is_active: source.is_active ?? team?.is_active ?? true,
    contact_name: source.contact_name || team?.contact_name || "",
    contact_email: source.contact_email || team?.contact_email || "",
    contact_phone: source.contact_phone || team?.contact_phone || "",
    contact_image_url: source.contact_image_url || team?.contact_image_url || "",
    fussball_de_matches_widget_code: "",
    fussball_de_table_widget_code: "",
    fussball_de_matches_widget_id:
      source.fussball_de_matches_widget_id || team?.fussball_de_matches_widget_id || "",
    fussball_de_table_widget_id:
      source.fussball_de_table_widget_id || team?.fussball_de_table_widget_id || "",
    fussball_de_team_url: source.fussball_de_team_url || team?.fussball_de_team_url || "",
  };
}

export default function AdminTeamsForm({ team, seasons = [], teamSeasons = [] }) {
  const router = useRouter();
  const initialSeason = useMemo(() => getCurrentSeason(seasons), [seasons]);
  const [form, setForm] = useState(() =>
    createInitialForm(team, seasons, teamSeasons, initialSeason?.id),
  );
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSeason(seasonId) {
    const season = seasons.find((item) => item.id === seasonId);
    setForm(createInitialForm(team, seasons, teamSeasons, season?.id));
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
      <FormSection
        eyebrow="Saison"
        title="Saison auswählen"
        description="Wähle zuerst aus, für welche Saison diese Mannschaft bearbeitet werden soll. Saisonbezogene Daten werden getrennt gespeichert."
      >
        <SelectField
          label="Saison"
          required
          value={form.season_id}
          onChange={(event) => updateSeason(event.target.value)}
        >
          <option value="">Saison auswählen</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}{season.is_current ? " · aktuell" : ""}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection eyebrow="Mannschaft" title="Grunddaten">
        <FormGrid>
          <InputField label="Name Deutsch" required value={form.name_de} onChange={(event) => updateField("name_de", event.target.value)} />
          <InputField label="Name Englisch" value={form.name_en} onChange={(event) => updateField("name_en", event.target.value)} />
          <InputField label="Slug" placeholder="e1" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
          <InputField label="Altersgruppe" value={form.age_group} onChange={(event) => updateField("age_group", event.target.value)} />
          <InputField label="Saison" value={form.season} disabled />
        </FormGrid>
      </FormSection>

      <FormSection eyebrow="Beschreibung" title="Texte & Trainingszeiten">
        <div className="space-y-4">
          <TextareaField label="Beschreibung Deutsch" rows={5} value={form.description_de} onChange={(event) => updateField("description_de", event.target.value)} />
          <TextareaField label="Beschreibung Englisch" rows={5} value={form.description_en} onChange={(event) => updateField("description_en", event.target.value)} />
          <TextareaField label="Trainingszeiten Deutsch" rows={3} value={form.training_times_de} onChange={(event) => updateField("training_times_de", event.target.value)} />
          <TextareaField label="Trainingszeiten Englisch" rows={3} value={form.training_times_en} onChange={(event) => updateField("training_times_en", event.target.value)} />
        </div>
      </FormSection>

      <FormSection eyebrow="Spielbetrieb" title="fussball.de Integration" description="Widget-Code aus fussball.de einfügen. Gespeichert werden automatisch nur die Widget-IDs.">
        <TeamFootballDeFields form={form} updateField={updateField} />
      </FormSection>

      <FormSection eyebrow="Kontakt" title="Ansprechpartner">
        <div className="space-y-4">
          <InputField label="Ansprechpartner" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} />
          <EmailField value={form.contact_email} onChange={(value) => updateField("contact_email", value)} />
          <PhoneField value={form.contact_phone} onChange={(value) => updateField("contact_phone", value)} />
          <TeamLogoUpload imageUrl={form.contact_image_url} onUpload={uploadContactImage} onRemove={() => updateField("contact_image_url", "")} />
        </div>
      </FormSection>

      <FormSection eyebrow="Medien" title="Mannschaftsbild">
        <TeamLogoUpload imageUrl={form.team_image_url} onUpload={uploadImage} onRemove={() => updateField("team_image_url", "")} />
      </FormSection>

      <FormSection eyebrow="Einstellungen" title="Status & Sortierung">
        <div className="space-y-6">
          <SortOrderField value={form.sort_order} onChange={(value) => updateField("sort_order", value)} />
          <ActiveStatusField checked={form.is_active} onChange={(value) => updateField("is_active", value)} entityLabel="Mannschaft" />
        </div>
      </FormSection>

      <FormActions loading={loading} submitLabel="Mannschaft speichern" cancelHref="/admin/teams" />
    </form>
  );
}
