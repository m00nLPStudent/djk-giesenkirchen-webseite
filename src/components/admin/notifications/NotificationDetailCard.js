"use client";

import { AdminInformationRow, AdminInformationSection, AdminStatusChip } from "@/components/admin/design-system";

function formatDate(value) {
  if (!value) return "Unbekannt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatWorkflowStatus(value) {
  if (value === "done") return "Erledigt";
  if (value === "in_progress") return "In Bearbeitung";
  return value || "Unbekannt";
}

export default function NotificationDetailCard({ item }) {
  if (!item) return null;
  return (
    <aside aria-label="Ausgewählte Benachrichtigung" className="min-w-0 rounded-[1.5rem] ring-2 ring-red-500/45 ring-offset-2 ring-offset-[#111116]">
      <AdminInformationSection title={item.title} className="h-full">
        <AdminInformationRow label="Status"><AdminStatusChip compact variant={item.isRead ? "neutral" : "warning"}>{item.isRead ? "Gelesen" : "Ungelesen"}</AdminStatusChip></AdminInformationRow>
        <AdminInformationRow label="Nachricht"><p className="break-words text-white/80">{item.message || "Keine weitere Beschreibung."}</p></AdminInformationRow>
        <AdminInformationRow label="Typ">{item.type}</AdminInformationRow>
        <AdminInformationRow label="Zeitpunkt">{formatDate(item.createdAt)}</AdminInformationRow>
        {item.metadata?.status ? <AdminInformationRow label="Bearbeitungsstatus">{formatWorkflowStatus(item.metadata.status)}</AdminInformationRow> : null}
        {item.metadata?.completedByName ? <AdminInformationRow label="Erledigt durch">{item.metadata.completedByName}</AdminInformationRow> : null}
        {item.metadata?.completedAt ? <AdminInformationRow label="Erledigt am">{formatDate(item.metadata.completedAt)}</AdminInformationRow> : null}
        {item.metadata?.teamName ? <AdminInformationRow label="Mannschaft">{item.metadata.teamName}</AdminInformationRow> : null}
        {item.metadata?.yearGroup ? <AdminInformationRow label="Jahrgang">{item.metadata.yearGroup}</AdminInformationRow> : null}
        {item.metadata?.seasonLabel ? <AdminInformationRow label="Saison">{item.metadata.seasonLabel}</AdminInformationRow> : null}
        {item.metadata?.roleLabel ? <AdminInformationRow label="Funktion">{item.metadata.roleLabel}</AdminInformationRow> : null}
      </AdminInformationSection>
    </aside>
  );
}
