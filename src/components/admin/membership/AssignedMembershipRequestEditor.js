"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveMembershipRequestStatusAction } from "@/app/admin/membership-requests/actions";
import { AdminActionBar, AdminButton, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection, AdminStatusChip } from "@/components/admin/design-system";

const nameOf = (request) => `${request.first_name || ""} ${request.last_name || ""}`.trim() || "Mitgliedsanfrage";
const statusLabel = (status) => status === "done" ? "Erledigt" : status === "in_progress" ? "In Bearbeitung" : "Neu";

export default function AssignedMembershipRequestEditor({ request, assignedOnly = false, notificationId = "" }) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status || "new");
  const [internalNote, setInternalNote] = useState(request.internal_note || "");
  const [loading, setLoading] = useState(false);
  const options = assignedOnly ? ["in_progress", "done"] : ["new", "in_progress", "done"];

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const result = await saveMembershipRequestStatusAction({ id: request.id }, { status, internal_note: internalNote });
    setLoading(false);
    if (result.error) return alert(result.error.message || "Die Anfrage konnte nicht gespeichert werden.");
    if (assignedOnly) {
      router.push(notificationId ? `/admin/notifications?notification=${encodeURIComponent(notificationId)}` : "/admin/notifications");
      return;
    }
    router.refresh();
  }

  return <form onSubmit={submit}><AdminDetailLayout header={<AdminDetailHeader backHref={assignedOnly ? "/admin/notifications" : "/admin/membership-requests"} backLabel={assignedOnly ? "Zurück zu Benachrichtigungen" : "Zurück zu Mitgliedsanfragen"} backVariant="pill" eyebrow="Mitgliedsanfrage" title={nameOf(request)} status={<AdminStatusChip variant={status === "done" ? "success" : status === "in_progress" ? "warning" : "danger"}>{statusLabel(status)}</AdminStatusChip>} meta={`Eingegangen ${request.created_at ? new Date(request.created_at).toLocaleString("de-DE") : "–"}`} />}>
    <AdminInformationSection title="Antragsteller"><AdminInformationRow label="Name">{nameOf(request)}</AdminInformationRow><AdminInformationRow label="Geburtsdatum">{request.birthdate || "–"}</AdminInformationRow><AdminInformationRow label="Telefon">{request.phone || "–"}</AdminInformationRow><AdminInformationRow label="E-Mail">{request.email || "–"}</AdminInformationRow><AdminInformationRow label="Jahrgang">{request.year_group || "–"}</AdminInformationRow><AdminInformationRow label="Mannschaft">{request.teams?.name_de || "–"}</AdminInformationRow></AdminInformationSection>
    <AdminInformationSection title="Status und Nachricht"><AdminInformationRow label="Status"><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#17171d] px-3 text-white">{options.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></AdminInformationRow><AdminInformationRow label="Nachricht"><p className="whitespace-pre-wrap break-words">{request.message || "–"}</p></AdminInformationRow>{Object.prototype.hasOwnProperty.call(request, "internal_note") ? <AdminInformationRow label="Interne Notiz"><textarea rows={5} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500" /></AdminInformationRow> : null}</AdminInformationSection>
    <AdminActionBar className="justify-end"><AdminButton type="submit" variant="primary" disabled={loading}>{loading ? "Speichert..." : "Anfrage speichern"}</AdminButton></AdminActionBar>
  </AdminDetailLayout></form>;
}
