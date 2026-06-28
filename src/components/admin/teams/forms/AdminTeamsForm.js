"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActiveStatusField,
  EmailField,
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  PhoneField,
  SortOrderField,
  TextareaField,
} from "@/components/admin/forms";
import TeamLogoUpload from "../components/TeamLogoUpload";
import { createSlug } from "../utils/slug";
import { uploadTeamImage, saveTeam } from "../services/teams.service";
import TeamFupaFields from "./fields/TeamFupaFields";

function createInitialForm(team) {
  return {
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
    fupa_matches_widget_code: "",
    fupa_table_widget_code: "",
    fupa_matches_widget_id: team?.fupa_matches_widget_id || "",
    fupa_table_widget_id: team?.fupa_table_widget_id || "",
    fupa_club_url: team?.fupa_club_url || "",
  };
}

export default function AdminTeamsForm({ team }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createInitialForm(team));
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
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
    setLoading(true);

    const payload = {
      ...form,
      contact_phone: form.contact_phone?.replace(/\s/g, "").replace(/\+/g, ""),
      slug: form.slug || createSlug(form.name_de),
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    const { error } = await saveTeam(payload, team?.id ?? null);
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
      <FormSection eyebrow="Mannschaft" title="Grunddaten">
        <FormGrid>
          <InputField label="Name Deutsch" required value={form.name_de} onChange={(event) => updateField("name_de", event.target.value)} />
          <InputField label="Name Englisch" value={form.name_en} onChange={(event) => updateField("name_en", event.target.value)} />
          <InputField label="Slug" placeholder="e1" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
          <InputField label="Altersgruppe" value={form.age_group} onChange={(event) => updateField("age_group", event.target.value)} />
          <InputField label="Saison" value={form.season} onChange={(event) => updateField("season", event.target.value)} />
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

      <FormSection eyebrow="Spielbetrieb" title="FuPa Integration" description="Widget-Code aus dem FuPa Widget-Builder einfügen. Gespeichert werden automatisch nur die sicheren Widget-IDs.">
        <TeamFupaFields form={form} updateField={updateField} />
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
