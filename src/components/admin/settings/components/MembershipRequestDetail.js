import { SelectField } from "@/components/admin/forms";
import Can from "@/components/admin/auth/Can";
import CoachAvatar from "@/components/admin/coaches/components/CoachAvatar";
import {
  AdminActionBar,
  AdminButton,
  AdminDetailHeader,
  AdminDetailLayout,
  AdminInformationRow,
  AdminInformationSection,
  AdminModuleEmptyState,
  AdminStatusChip,
} from "@/components/admin/design-system";

const nameOf = (request) => `${request?.first_name || ""} ${request?.last_name || ""}`.trim() || "Mitgliedsanfrage";
const statusVariant = (status) => status === "done" ? "success" : status === "in_progress" ? "warning" : "danger";

function TargetAvatar({ target, size = "h-10 w-10" }) {
  return <CoachAvatar coach={{ displayName: target?.displayName || "Zielperson", imageUrl: target?.imageUrl }} sizeClassName={size} />;
}

function ForwardTargetPicker({ targets, value, onChange }) {
  if (!targets.length) return <AdminModuleEmptyState title="Keine Zielpersonen" description="Für den ausgewählten Typ stehen keine Personen zur Verfügung." />;
  return <fieldset><legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Person</legend><div className="grid gap-2 sm:grid-cols-2">{targets.map((target) => {
    const selected = String(value) === String(target.id);
    return <label key={target.id} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-red-500 ${selected ? "border-red-500 bg-red-600/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}><input type="radio" name="forward_target" value={target.id} checked={selected} onChange={(event) => onChange(event.target.value)} className="sr-only" /><TargetAvatar target={target} /><span className="min-w-0 flex-1"><strong className="block break-words text-sm text-white">{target.displayName}</strong><span className="mt-1 block break-words text-xs text-white/55">{target.roleLabel} · {(target.teamLabels || []).join(", ")}</span>{target.email ? <span className="mt-1 block break-all text-xs text-white/45">{target.email}</span> : null}<span className="mt-2 block"><AdminStatusChip compact variant={target.isActive ? "success" : "warning"}>{target.isActive ? "Aktiv" : "Inaktiv"}</AdminStatusChip></span></span></label>;
  })}</div></fieldset>;
}

function ForwardingInformation({ request, target, formatRequestDate, getMembershipForwardTypeLabel }) {
  if (!request.forwarded_at) return <AdminModuleEmptyState title="Keine Weiterleitung vorhanden" description="Die Anfrage wurde noch keiner Person zugeordnet." />;
  const displayName = target?.displayName || request.forwarded_to_name || request.forwarded_to_email || "Zielperson nicht mehr verfügbar";
  const resolved = { ...target, displayName };
  return <div className="space-y-5 px-1 pb-2 pt-1"><div className="flex items-start gap-4"><TargetAvatar target={resolved} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="break-words text-white">{displayName}</strong><AdminStatusChip variant="success">Weitergeleitet</AdminStatusChip></div><p className="mt-1 break-words text-sm text-white/60">{target?.roleLabel || getMembershipForwardTypeLabel(request.forwarded_to_type)}</p></div></div><dl className="grid gap-4 text-sm sm:grid-cols-2"><div className="space-y-1"><dt className="text-white/45">E-Mail</dt><dd className="break-all text-white/75">{target?.email || request.forwarded_to_email || "–"}</dd></div><div className="space-y-1"><dt className="text-white/45">Zeitpunkt</dt><dd className="text-white/75">{formatRequestDate(request.forwarded_at)}</dd></div>{target?.teamLabels?.length ? <div className="space-y-1 sm:col-span-2"><dt className="text-white/45">Mannschaft / Bereich</dt><dd className="break-words text-white/75">{target.teamLabels.join(", ")}</dd></div> : null}{request.forwarded_note ? <div className="space-y-1 sm:col-span-2"><dt className="text-white/45">Notiz</dt><dd className="whitespace-pre-wrap break-words text-white/65">{request.forwarded_note}</dd></div> : null}</dl></div>;
}

export default function MembershipRequestDetail({ selectedMembershipRequest: request, membershipRequestForm: form, membershipRequestLoading: loading, forwardingTargets, membershipStatusOptions, membershipForwardTypeOptions, onSubmit, onFieldChange, onForward, onMarkDone, formatRequestDate, getMembershipForwardTypeLabel }) {
  if (!request) return <AdminModuleEmptyState title="Anfrage auswählen" description="Wähle eine Mitgliedsanfrage aus der Liste, um Details und Bearbeitung zu öffnen." />;
  const forwardedTarget = forwardingTargets.find((target) => String(target.id) === String(request.forwarded_to_id));
  return <form onSubmit={onSubmit} className="min-w-0">
    <AdminDetailLayout header={<AdminDetailHeader eyebrow="Mitgliedsanfrage" title={nameOf(request)} status={<AdminStatusChip variant={statusVariant(request.status)}>{membershipStatusOptions.find((item) => item.value === form.status)?.label || form.status}</AdminStatusChip>} meta={`Eingegangen ${formatRequestDate(request.created_at)}`} />}>
      <AdminInformationSection title="Antragsteller">
        <AdminInformationRow label="Name">{nameOf(request)}</AdminInformationRow><AdminInformationRow label="Geburtsdatum">{request.birthdate || "–"}</AdminInformationRow><AdminInformationRow label="Telefon">{request.phone || "–"}</AdminInformationRow><AdminInformationRow label="E-Mail">{request.email || "–"}</AdminInformationRow><AdminInformationRow label="Jahrgang">{request.year_group || "–"}</AdminInformationRow><AdminInformationRow label="Mannschaft">{request.team_seasons?.name_de || request.teams?.name_de || "–"}</AdminInformationRow><AdminInformationRow label="Saison">{request.team_seasons?.seasons?.name || "–"}</AdminInformationRow>
      </AdminInformationSection>
      <AdminInformationSection title="Status und Nachricht">
        <AdminInformationRow label="Status"><SelectField value={form.status} onChange={(event) => onFieldChange("status", event.target.value)}>{membershipStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField></AdminInformationRow>
        <AdminInformationRow label="Nachricht"><p>{request.message || "–"}</p></AdminInformationRow>
        {Object.prototype.hasOwnProperty.call(request, "internal_note") ? <AdminInformationRow label="Interne Notiz"><textarea rows={5} value={form.internal_note} onChange={(event) => onFieldChange("internal_note", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500" /></AdminInformationRow> : null}
      </AdminInformationSection>
      <AdminInformationSection title="Weiterleitung"><ForwardingInformation request={request} target={forwardedTarget} formatRequestDate={formatRequestDate} getMembershipForwardTypeLabel={getMembershipForwardTypeLabel} /></AdminInformationSection>
      <AdminInformationSection title="Zielperson auswählen">
        <AdminInformationRow label="Bereich"><SelectField value={form.forwarded_to_type} onChange={(event) => onFieldChange("forwarded_to_type", event.target.value)}><option value="">Bitte wählen</option>{membershipForwardTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectField></AdminInformationRow>
        <AdminInformationRow label="Ziel"><ForwardTargetPicker targets={forwardingTargets} value={form.forwarded_to_id} onChange={(value) => onFieldChange("forwarded_to_id", value)} /></AdminInformationRow>
        <AdminInformationRow label="Notiz"><textarea rows={4} value={form.forwarded_note} onChange={(event) => onFieldChange("forwarded_note", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none transition focus:border-red-500" /></AdminInformationRow>
        <AdminInformationRow label="Aktion"><Can permission="membership_requests.forward" uiOnly><AdminActionBar><AdminButton onClick={onForward} disabled={loading}>{loading ? "Leitet weiter..." : "Weiterleiten"}</AdminButton></AdminActionBar></Can></AdminInformationRow>
      </AdminInformationSection>
      <Can permission="membership_requests.edit" uiOnly><AdminActionBar className="justify-end"><AdminButton onClick={onMarkDone} disabled={loading}>Als erledigt markieren</AdminButton><AdminButton type="submit" variant="primary" disabled={loading}>{loading ? "Speichert..." : "Anfrage speichern"}</AdminButton></AdminActionBar></Can>
    </AdminDetailLayout>
  </form>;
}
