"use client";

import EventEditorForm from "./EventEditorForm";

export default function AdminEventsForm({ event = null, teams = [], eventTypes = [] }) {
  return <EventEditorForm event={event} teams={teams} eventTypes={eventTypes} />;
}
