"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { FormAlert, FormSection } from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import useEntityForm from "@/components/admin/hooks/useEntityForm";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import { REQUIRED_FIELDS_MESSAGE } from "@/components/admin/utils/validation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
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

const COACH_FORM_TABS = [
  { id: "basic", label: "Grunddaten" },
  { id: "role", label: "Verein" },
  { id: "contact", label: "Kontakt" },
  { id: "profile", label: "Profil" },
  { id: "media", label: "Medien" },
  { id: "settings", label: "Einstellungen" },
];

export default function AdminCoachesForm({ coach, teams = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
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
    logAdminSaveEvent({
      module: "coaches",
      mode: coach?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const { error } = await saveCoach(
      createCoachPayload(form),
      coach?.id ?? null,
    );

    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "coaches",
        mode: coach?.id ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "coaches",
      mode: coach?.id ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    await revalidatePublicContentAction("coaches");

    router.push("/admin/coaches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
      <TabNavigation
        tabs={COACH_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {hasErrors && <FormAlert>{REQUIRED_FIELDS_MESSAGE}</FormAlert>}

      {activeTab === "basic" && (
        <FormSection
          eyebrow="Trainer"
          title="Persönliche Daten"
          description="Grunddaten für die interne Verwaltung und die öffentliche Trainerseite."
        >
          <CoachBasicFields
            form={form}
            errors={errors}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "role" && (
        <FormSection
          eyebrow="Verein"
          title="Vereinsdaten"
          description="Funktion, Mannschaftszuordnung, Lizenz und Anzeige-Reihenfolge."
        >
          <CoachRoleFields
            form={form}
            errors={errors}
            teams={teams}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "contact" && (
        <FormSection
          eyebrow="Kontakt"
          title="Kontaktdaten"
          description="Telefon und WhatsApp werden automatisch ins internationale Format für Links umgewandelt."
        >
          <CoachContactFields
            form={form}
            errors={errors}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "profile" && (
        <FormSection
          eyebrow="Profil"
          title="Profilangaben"
          description="Weitere Angaben für die öffentliche Darstellung."
        >
          <CoachProfileFields
            form={form}
            errors={errors}
            updateField={updateField}
          />
        </FormSection>
      )}

      {activeTab === "media" && (
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
      )}

      {activeTab === "settings" && (
        <FormSection eyebrow="Einstellungen" title="Status & Sortierung">
          <CoachSettingsFields form={form} updateField={updateField} />
        </FormSection>
      )}

      <AdminSaveBar
        loading={loading}
        submitLabel="Trainer speichern"
        cancelHref="/admin/coaches"
      />
    </form>
  );
}
