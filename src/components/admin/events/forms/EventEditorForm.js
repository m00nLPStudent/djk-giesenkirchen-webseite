"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormActions,
  FormGrid,
  FormSection,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/admin/forms";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import AdminImageUpload from "@/components/admin/media/AdminImageUpload";
import {
  createEvent,
  updateEvent,
  uploadEventImage,
} from "../services/events.service";

const EVENT_FORM_TABS = [
  { id: "basic", label: "Grunddaten" },
  { id: "time", label: "Datum & Zeit" },
  { id: "location", label: "Ort" },
  { id: "media", label: "Medien" },
  { id: "settings", label: "Einstellungen" },
];

const EVENT_TYPES = [
  ["vereinstermin", "Vereinstermin"],
  ["training", "Training"],
  ["spiel", "Spiel"],
  ["turnier", "Turnier"],
  ["sonstiges", "Sonstiges"],
];

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function createInitialEventForm(event) {
  return {
    title_de: event?.title_de || "",
    title_en: event?.title_en || "",
    teaser_de: event?.teaser_de || "",
    teaser_en: event?.teaser_en || "",
    description_de: event?.description_de || "",
    description_en: event?.description_en || "",
    event_type: event?.event_type || "vereinstermin",
    starts_at: formatDateTimeLocal(event?.starts_at),
    ends_at: formatDateTimeLocal(event?.ends_at),
    is_all_day: event?.is_all_day ?? false,
    location_name: event?.location_name || "",
    location_address: event?.location_address || "",
    location_city: event?.location_city || "",
    team_id: event?.team_id || "",
    external_url: event?.external_url || "",
    image_url: event?.image_url || "",
    is_published: event?.is_published ?? false,
    is_featured: event?.is_featured ?? false,
    sort_order: event?.sort_order ?? 0,
  };
}

function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function EventEditorForm({ event = null, teams = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialEventForm(event));
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(event?.id);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImageUpload(file) {
    const { data, error } = await uploadEventImage(file, {
      ...form,
      id: event?.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    if (!form.title_de.trim()) {
      alert("Bitte einen Titel eintragen.");
      setActiveTab("basic");
      return;
    }

    if (!form.starts_at) {
      alert("Bitte Startdatum und Uhrzeit eintragen.");
      setActiveTab("time");
      return;
    }

    setLoading(true);

    const payload = {
      title_de: form.title_de.trim(),
      title_en: form.title_en.trim() || null,
      teaser_de: form.teaser_de.trim() || null,
      teaser_en: form.teaser_en.trim() || null,
      description_de: form.description_de.trim() || null,
      description_en: form.description_en.trim() || null,
      event_type: form.event_type,
      starts_at: toIsoOrNull(form.starts_at),
      ends_at: toIsoOrNull(form.ends_at),
      is_all_day: Boolean(form.is_all_day),
      location_name: form.location_name.trim() || null,
      location_address: form.location_address.trim() || null,
      location_city: form.location_city.trim() || null,
      team_id: form.team_id || null,
      external_url: form.external_url.trim() || null,
      image_url: form.image_url || null,
      is_published: Boolean(form.is_published),
      is_featured: Boolean(form.is_featured),
      sort_order: Number(form.sort_order || 0),
    };

    const { error } = isEdit
      ? await updateEvent(event.id, payload)
      : await createEvent(payload);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <TabNavigation
        tabs={EVENT_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "basic" && (
        <FormSection
          eyebrow="Termine"
          title="Grunddaten"
          description="Titel, Teaser und Beschreibung für den Termin oder die Veranstaltung."
        >
          <FormGrid>
            <InputField
              label="Titel Deutsch"
              required
              value={form.title_de}
              onChange={(eventValue) =>
                updateField("title_de", eventValue.target.value)
              }
            />
            <InputField
              label="Titel Englisch"
              value={form.title_en}
              onChange={(eventValue) =>
                updateField("title_en", eventValue.target.value)
              }
            />
          </FormGrid>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TextareaField
              label="Teaser Deutsch"
              rows={4}
              value={form.teaser_de}
              onChange={(eventValue) =>
                updateField("teaser_de", eventValue.target.value)
              }
            />
            <TextareaField
              label="Teaser Englisch"
              rows={4}
              value={form.teaser_en}
              onChange={(eventValue) =>
                updateField("teaser_en", eventValue.target.value)
              }
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <TextareaField
              label="Beschreibung Deutsch"
              rows={8}
              value={form.description_de}
              onChange={(eventValue) =>
                updateField("description_de", eventValue.target.value)
              }
            />
            <TextareaField
              label="Beschreibung Englisch"
              rows={8}
              value={form.description_en}
              onChange={(eventValue) =>
                updateField("description_en", eventValue.target.value)
              }
            />
          </div>
        </FormSection>
      )}

      {activeTab === "time" && (
        <FormSection
          eyebrow="Termin"
          title="Datum und Zeit"
          description="Lege Zeitraum, Tagesstatus und Typ des Events fest."
        >
          <FormGrid>
            <SelectField
              label="Typ"
              value={form.event_type}
              onChange={(eventValue) =>
                updateField("event_type", eventValue.target.value)
              }
            >
              {EVENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Mannschaft (optional)"
              value={form.team_id}
              onChange={(eventValue) =>
                updateField("team_id", eventValue.target.value)
              }
            >
              <option value="">Keine Mannschaft</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name_de}
                </option>
              ))}
            </SelectField>
          </FormGrid>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              label="Start"
              type="datetime-local"
              required
              value={form.starts_at}
              onChange={(eventValue) =>
                updateField("starts_at", eventValue.target.value)
              }
            />
            <InputField
              label="Ende"
              type="datetime-local"
              value={form.ends_at}
              onChange={(eventValue) =>
                updateField("ends_at", eventValue.target.value)
              }
            />
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
            <input
              type="checkbox"
              checked={form.is_all_day}
              onChange={(eventValue) =>
                updateField("is_all_day", eventValue.target.checked)
              }
            />
            Ganztägiger Termin
          </label>
        </FormSection>
      )}

      {activeTab === "location" && (
        <FormSection
          eyebrow="Ort"
          title="Veranstaltungsort"
          description="Pflege Ort und optionale externe URL für weitere Informationen."
        >
          <FormGrid>
            <InputField
              label="Ort"
              value={form.location_name}
              onChange={(eventValue) =>
                updateField("location_name", eventValue.target.value)
              }
            />
            <InputField
              label="Stadt"
              value={form.location_city}
              onChange={(eventValue) =>
                updateField("location_city", eventValue.target.value)
              }
            />
          </FormGrid>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              label="Adresse"
              value={form.location_address}
              onChange={(eventValue) =>
                updateField("location_address", eventValue.target.value)
              }
            />
            <InputField
              label="Externer Link"
              placeholder="https://..."
              value={form.external_url}
              onChange={(eventValue) =>
                updateField("external_url", eventValue.target.value)
              }
            />
          </div>
        </FormSection>
      )}

      {activeTab === "media" && (
        <FormSection
          eyebrow="Medien"
          title="Event-Bild"
          description="Optionales Bild für Kartenansicht und spätere öffentliche Darstellung."
        >
          <AdminImageUpload
            imageUrl={form.image_url}
            onUpload={handleImageUpload}
            onRemove={() => updateField("image_url", "")}
            description="Lade ein Bild für den Termin hoch."
            uploadLabel="Bild hochladen"
            removeLabel="Bild entfernen"
            alt={form.title_de || "Event-Bild"}
          />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection
          eyebrow="Einstellungen"
          title="Sichtbarkeit und Sortierung"
          description="Steuere Veröffentlichung und Hervorhebung im Vereinssystem."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(eventValue) =>
                  updateField("is_published", eventValue.target.checked)
                }
              />
              Veröffentlicht
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(eventValue) =>
                  updateField("is_featured", eventValue.target.checked)
                }
              />
              Auf Startseite hervorheben
            </label>
          </div>

          <div className="mt-5 max-w-sm">
            <InputField
              label="Sortierung"
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(eventValue) =>
                updateField("sort_order", Number(eventValue.target.value || 0))
              }
            />
          </div>
        </FormSection>
      )}

      <FormActions
        loading={loading}
        submitLabel={isEdit ? "Änderungen speichern" : "Termin speichern"}
        cancelHref="/admin/events"
      />
    </form>
  );
}
