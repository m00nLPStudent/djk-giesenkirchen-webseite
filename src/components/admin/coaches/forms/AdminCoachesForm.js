"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import { loadCoachMediaPickerAction, saveCoachWithScopeAction, uploadCoachMediaAction } from "@/app/admin/coaches/actions";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { FormAlert, FormSection } from "@/components/admin/forms";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import useEntityForm from "@/components/admin/hooks/useEntityForm";
import AdminMediaPicker from "@/components/admin/media-library/AdminMediaPicker";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import { REQUIRED_FIELDS_MESSAGE } from "@/components/admin/utils/validation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import {
  createCoachPayload,
  createInitialCoachForm,
  getCoachFormBlockingMessage,
  getCoachFormWarningMessage,
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

export default function AdminCoachesForm({
  coach,
  teamOptionsResult,
  coachSeasonalReadModel,
  initialMediaAsset = null,
  sportContext = "football",
  returnPath = "/admin/coaches",
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedMedia, setSelectedMedia] = useState(initialMediaAsset);
  const teamOptions = useMemo(
    () => teamOptionsResult?.teamOptions || [],
    [teamOptionsResult?.teamOptions],
  );
  const {
    form,
    setForm,
    errors,
    setErrors,
    loading,
    setLoading,
    updateField,
    validateForm,
    hasErrors,
  } = useEntityForm({
    initialForm: createInitialCoachForm(
      coach,
      coachSeasonalReadModel,
      teamOptions,
    ),
    validate: validateCoachForm,
  });
  const assignedDepartmentSlugs = useMemo(() => new Set((form.assignments || []).flatMap((assignment) => {
    const option = teamOptions.find((item) => item.teamSeasonId === assignment.team_season_id);
    const relation = option?.team?.departments;
    const slug = Array.isArray(relation) ? relation[0]?.slug : relation?.slug;
    return slug ? [slug] : [];
  })), [form.assignments, teamOptions]);
  const effectiveSportContext = sportContext === "global" && assignedDepartmentSlugs.size === 1 && assignedDepartmentSlugs.has("tischtennis")
    ? "table_tennis"
    : sportContext === "global" ? "football" : sportContext;

  const blockingMessage = getCoachFormBlockingMessage(
    teamOptionsResult,
    coachSeasonalReadModel,
    form.assignments,
  );
  const warningMessage = getCoachFormWarningMessage(
    teamOptionsResult,
    coachSeasonalReadModel,
    teamOptions,
  );

  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({ ...current, image_media_asset_id: media?.id || null, image_url: media?.previewUrl || COACH_PLACEHOLDER_IMAGE }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (blockingMessage) {
      setActiveTab("role");
      alert(blockingMessage);
      return;
    }

    logAdminSaveEvent({
      module: "coaches",
      mode: coach?.id ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setActiveTab(nextErrors.assignments ? "role" : "basic");
      return;
    }

    setLoading(true);
    const { error } = await saveCoachWithScopeAction(
      createCoachPayload(form),
      coach?.id ?? null,
      { departmentSlug: sportContext === "global" ? null : sportContext === "table_tennis" ? "tischtennis" : "fussball" },
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
    router.push(returnPath);
    router.refresh();
  }

  function handleAssignmentErrorReset() {
    if (!errors.assignments) return;
    setErrors((current) => ({ ...current, assignments: null }));
  }

  return (
    <form
      id="coach-edit-form"
      onSubmit={handleSubmit}
      className="mt-5 space-y-6 scroll-mt-28"
      noValidate
    >
      <TabNavigation
        tabs={COACH_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {blockingMessage && <FormAlert>{blockingMessage}</FormAlert>}
      {!blockingMessage && warningMessage && (
        <FormAlert tone="warning">{warningMessage}</FormAlert>
      )}
      {hasErrors && <FormAlert>{REQUIRED_FIELDS_MESSAGE}</FormAlert>}

      {activeTab === "basic" && (
        <FormSection
          eyebrow="Trainer"
          title="Persoenliche Daten"
          description="Grunddaten fuer die interne Verwaltung und die oeffentliche Trainerseite."
        >
          <CoachBasicFields
            form={form}
            errors={errors}
            updateField={updateField}
            sportContext={effectiveSportContext}
          />
        </FormSection>
      )}

      {activeTab === "role" && (
        <FormSection
          eyebrow="Verein"
          title="Vereinsdaten"
          description="Fallback-Funktion fuer teamlose Trainer, Lizenz und aktuelle Saisonzuordnungen mit mehreren Mannschaften oder Rollen."
        >
          <CoachRoleFields
            form={form}
            errors={errors}
            teamOptions={teamOptions}
            blockingMessage={blockingMessage}
            setForm={(updater) => {
              handleAssignmentErrorReset();
              setForm(updater);
            }}
            updateField={updateField}
            sportContext={effectiveSportContext}
          />
        </FormSection>
      )}

      {activeTab === "contact" && (
        <FormSection
          eyebrow="Kontakt"
          title="Kontaktdaten"
          description="Telefon und WhatsApp werden automatisch ins internationale Format fuer Links umgewandelt."
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
          description="Weitere Angaben fuer die oeffentliche Darstellung."
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
          description="Das Bild wird im Adminbereich und auf der oeffentlichen Trainerprofilseite verwendet."
        >
          <AdminMediaPicker value={selectedMedia} legacyUrl={selectedMedia ? null : form.image_url} placeholderUrl={COACH_PLACEHOLDER_IMAGE} onChange={handleMediaChange} loadAction={(filters) => loadCoachMediaPickerAction(filters, coach?.id || null)} uploadAction={(data) => uploadCoachMediaAction(data, coach?.id || null)} />
        </FormSection>
      )}

      {activeTab === "settings" && (
        <FormSection eyebrow="Einstellungen" title="Status und Fallback-Sortierung">
          <CoachSettingsFields form={form} updateField={updateField} />
        </FormSection>
      )}

      <AdminSaveBar
        loading={loading}
        submitLabel="Trainer speichern"
        cancelHref={returnPath}
      />
    </form>
  );
}
