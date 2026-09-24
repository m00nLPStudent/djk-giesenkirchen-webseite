"use client";

import { deleteEventAction } from "@/app/admin/events/actions";
import AdminRemoveButton from "@/components/admin/delete/AdminRemoveButton";

export default function EventDeleteButton({ eventId, title }) {
  return (
    <AdminRemoveButton
      label="Termin"
      name={title}
      action={() => deleteEventAction(eventId)}
      affected={["Termin", "Zugehörige Dokumentverknüpfungen"]}
      preserved={["Zentrale Medien und Dateien"]}
      inlineError
      successHref="/admin/events"
      triggerLabel="Termin löschen"
      confirmLabel="Termin löschen"
      confirmationTitle="Termin wirklich löschen?"
      confirmationDescription="Dieser Termin wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
    />
  );
}
