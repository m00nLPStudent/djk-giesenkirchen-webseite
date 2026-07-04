"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormActions } from "@/components/admin/forms";
import TabNavigation from "@/components/admin/ui/TabNavigation";
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
  createEvent,
  deleteEventDocument,
  getEventDocuments,
  updateEvent,
  uploadEventDocument,
  uploadEventImage,
} from "../services/events.service";

export default function EventEditorForm({ event = null, teams = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState(() => createInitialEventForm(event));
  const [loading, setLoading] = useState(false);
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
          handleImageUpload={handleImageUpload}
          updateField={updateField}
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

      <FormActions
        loading={loading}
        submitLabel={isEdit ? "Änderungen speichern" : "Termin speichern"}
        cancelHref="/admin/events"
      />
    </form>
  );
}
