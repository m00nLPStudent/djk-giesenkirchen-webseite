"use client";

import EventEditorForm from "./EventEditorForm";

export default function AdminEventsForm({ event = null, teams = [] }) {
  return <EventEditorForm event={event} teams={teams} />;
}
