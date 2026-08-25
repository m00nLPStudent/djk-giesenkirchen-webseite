"use client";

import EventEditorForm from "./EventEditorForm";

export default function AdminEventsForm({ event = null, initialMedia = null, teams = [], eventTypes = [] }) {
  return <EventEditorForm event={event} initialMedia={initialMedia} teams={teams} eventTypes={eventTypes} />;
}
