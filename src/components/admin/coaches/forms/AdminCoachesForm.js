"use client";

import { useRouter } from "next/navigation";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { FormActions, FormSection } from "@/components/admin/forms";
import useEntityForm from "@/components/admin/hooks/useEntityForm";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import { REQUIRED_FIELDS_MESSAGE } from "@/components/admin/utils/validation";
import CoachImageUpload from "../components/CoachImageUpload";
import {
  deleteCoachImage,
  uploadCoachImage,
  saveCoach,
} from "../services/coaches.service";
import {
  createCoachPayload,
  createInitialCoachForm,
  validateCoachForm,
} from "./coachForm.helpers";
import CoachBasicFields from "./fields/CoachBasicFields";
import CoachContactFields from "./fields/CoachContactFields";
import CoachProfileFields from "./fields/CoachProfileFields";
import CoachRoleFields from "./fields/CoachRoleFields";
import CoachSettingsFields from "./fields/CoachSettingsFields";

export default function AdminCoachesForm({ coach, teams = [] }) {
  const router = useRouter();
  const {
    form,
    errors,
    loading,
    setLoading,
    updateField,
    validateForm,
    hasErrors,
  } = useEntityForm({
    initialForm: createInitialCoachForm(coach),
    validate: validateCoachForm,
  });

  const { uploadImage, removeImage } = useImageUpload({
    currentUrl: form.image_url,
    placeholderUrl: COACH_PLACEHOLDER_IMAGE,
    uploadAction: uploadCoachImage,
    deleteAction: deleteCoachImage,
    onChange: (url) => updateField("image_url", url),
    getUploadContext: () => ({
      id: coach?.id,
      name: `${form.first_name} ${form.last_name}`.trim(),
    }),
  });

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    const { error } = await saveCoach(createCoachPayload(form), coach?.id ?? null);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    router.push("/admin/coaches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      {hasErrors && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
          <p className="font-bold">{REQUIRED_FIELDS_MESSAGE}</p>
        </div>
      )}

      <FormSection
        eyebrow="Trainer"
        title="Persönliche Daten"
        description="Grunddaten für die interne Verwaltung und die öffentliche Trainerseite."
      >
        <CoachBasicFields form={form} errors={errors} updateField={updateField} />
      </FormSection>

      <FormSection
        eyebrow="Verein"
        title="Vereinsdaten"
        description="Funktion, Mannschaftszuordnung, Lizenz und Anzeige-Reihenfolge."
      >
        <CoachRoleFields form={form} errors={errors} teams={teams} updateField={updateField} />
      </FormSection>

      <FormSection
        eyebrow="Kontakt"
        title="Kontaktdaten"
        description="Telefon und WhatsApp werden automatisch ins internationale Format für Links umgewandelt."
      >
        <CoachContactFields form={form} errors={errors} updateField={updateField} />
      </FormSection>

      <FormSection
        eyebrow="Profil"
        title="Profilangaben"
        description="Weitere Angaben für die öffentliche Darstellung."
      >
        <CoachProfileFields form={form} errors={errors} updateField={updateField} />
      </FormSection>

      <FormSection
        eyebrow="Medien"
        title="Trainerbild"
        description="Das Bild wird im Adminbereich und auf der öffentlichen Trainerprofilseite verwendet."
      >
        <CoachImageUpload
          imageUrl={form.image_url || COACH_PLACEHOLDER_IMAGE}
          placeholderUrl={COACH_PLACEHOLDER_IMAGE}
          onUpload={uploadImage}
          onRemove={removeImage}
        />
      </FormSection>

      <FormSection eyebrow="Einstellungen" title="Status & Sortierung">
        <CoachSettingsFields form={form} updateField={updateField} />
      </FormSection>

      <FormActions
        loading={loading}
        submitLabel="Trainer speichern"
        cancelHref="/admin/coaches"
      />
    </form>
  );
}
