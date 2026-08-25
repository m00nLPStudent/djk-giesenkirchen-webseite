"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";
import AdminSaveBar from "@/components/admin/common/AdminSaveBar";
import TabNavigation from "@/components/admin/ui/TabNavigation";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import { createSlug } from "@/lib/slug";
import { EVENT_FORM_TABS } from "./eventEditor.constants";
import {
  createInitialEventForm,
  sortDocuments,
} from "./eventEditor.initialState";
import { buildEventPayload } from "./eventEditor.payload";
import EventBasicTab from "./tabs/EventBasicTab";
import EventDocumentsTab from "./tabs/EventDocumentsTab";
import EventLocationTab from "./tabs/EventLocationTab";
import EventMediaTab from "./tabs/EventMediaTab";
import EventSettingsTab from "./tabs/EventSettingsTab";
import EventTimeTab from "./tabs/EventTimeTab";
import {
  deleteEventDocument,
  getEventDocuments,
  uploadEventDocument,
} from "../services/events.service";
import { loadEventMediaPickerAction, saveEventWithNotificationAction, uploadEventMediaAction } from "@/app/admin/events/actions";

export default function EventEditorForm({ event = null, initialMedia = null, teams = [], eventTypes = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialEventForm(event, eventTypes));
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documents, setDocuments] = useState(() =>
    sortDocuments(event?.event_documents || []),
  );
  const isEdit = Boolean(event?.id);
  const hasRecurrence = form.recurrence_type !== "none";
  const publicSlug = form.slug || createSlug(form.title_de);
  const publicUrl = publicSlug ? `/termine/${publicSlug}` : "";

  useEffect(() => {
    async function loadDocuments() {
      if (!isEdit || !event?.id) return;

      setDocumentsLoading(true);
      const { data, error } = await getEventDocuments(event.id);
      setDocumentsLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      setDocuments(sortDocuments(data || []));
    }

    void loadDocuments();
  }, [event?.id, isEdit]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleMediaChange(media) {
    setSelectedMedia(media || null);
    setForm((current) => ({
      ...current,
      image_media_asset_id: media?.id || null,
      remove_legacy_image: !media,
    }));
  }

  async function handleDocumentUpload(file) {
    if (!event?.id) return;

    const { data, error } = await uploadEventDocument(file, event.id);
    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDocuments((current) => sortDocuments([...current, data]));
    }
  }

  async function handleDocumentDelete(documentItem) {
    const { error } = await deleteEventDocument(documentItem);
    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((current) =>
      current.filter((item) => item.id !== documentItem.id),
    );
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    logAdminSaveEvent({
      module: "events",
      mode: isEdit ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

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
    const payload = buildEventPayload({ form, publicSlug, hasRecurrence });

    const { error } = await saveEventWithNotificationAction(
      payload,
      isEdit ? event.id : null,
    );

    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "events",
        mode: isEdit ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    logAdminSaveEvent({
      module: "events",
      mode: isEdit ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      navigationTriggered: true,
    });

    await revalidatePublicContentAction("events");

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form id="event-editor-form" onSubmit={handleSubmit} className="space-y-6">
      <TabNavigation
        tabs={EVENT_FORM_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "basic" && (
        <EventBasicTab
          form={form}
          isEdit={isEdit}
          event={event}
          updateField={updateField}
        />
      )}

      {activeTab === "time" && (
        <EventTimeTab
          form={form}
          teams={teams}
          eventTypes={eventTypes}
          hasRecurrence={hasRecurrence}
          updateField={updateField}
        />
      )}

      {activeTab === "location" && (
        <EventLocationTab form={form} updateField={updateField} />
      )}

      {activeTab === "media" && (
        <EventMediaTab
          form={form}
          selectedMedia={selectedMedia}
          onMediaChange={handleMediaChange}
          loadMediaAction={(filters) => loadEventMediaPickerAction(filters, event?.id || null)}
          uploadMediaAction={(data) => uploadEventMediaAction(data, event?.id || null)}
        />
      )}

      {activeTab === "documents" && (
        <EventDocumentsTab
          isEdit={isEdit}
          documents={documents}
          setDocuments={setDocuments}
          onUploadDocument={handleDocumentUpload}
          onDeleteDocument={handleDocumentDelete}
          documentsLoading={documentsLoading}
        />
      )}

      {activeTab === "settings" && (
        <EventSettingsTab
          form={form}
          publicUrl={publicUrl}
          updateField={updateField}
        />
      )}

      <AdminSaveBar
        loading={loading}
        submitLabel={isEdit ? "Änderungen speichern" : "Termin speichern"}
        cancelHref="/admin/events"
      />
    </form>
  );
}
