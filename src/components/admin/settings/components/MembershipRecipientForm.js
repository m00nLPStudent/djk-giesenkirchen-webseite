import { InputField, SelectField } from "@/components/admin/forms";
import Can from "@/components/admin/auth/Can";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection, AdminStatusChip } from "@/components/admin/design-system";

export default function MembershipRecipientForm({ selectedMembershipRecipient, membershipRecipientForm: form, membershipRecipientLoading: loading, membershipRequestTypeOptions, onSubmit, onFieldChange, onReset, onDelete }) {
  const title = selectedMembershipRecipient ? (selectedMembershipRecipient.label || selectedMembershipRecipient.email) : "Neuer Empfänger";
  return <form onSubmit={onSubmit} className="min-w-0">
    <AdminDetailLayout header={<AdminDetailHeader eyebrow="Empfängerverwaltung" title={title} status={<AdminStatusChip variant={form.is_active ? "success" : "warning"}>{form.is_active ? "Aktiv" : "Inaktiv"}</AdminStatusChip>} />} dangerZone={selectedMembershipRecipient ? <Can permission="membership_requests.edit" uiOnly><AdminDangerZone title="Empfänger löschen" description="Der bestehende Empfänger wird dauerhaft entfernt."><AdminButton variant="danger" onClick={onDelete}>Empfänger löschen</AdminButton></AdminDangerZone></Can> : null}>
      <AdminInformationSection title="Empfängerdaten">
        <AdminInformationRow label="E-Mail"><InputField type="email" required value={form.email} onChange={(event) => onFieldChange("email", event.target.value)} /></AdminInformationRow>
        <AdminInformationRow label="Bezeichnung"><InputField value={form.label} onChange={(event) => onFieldChange("label", event.target.value)} /></AdminInformationRow>
        <AdminInformationRow label="Anfrageart"><SelectField value={form.request_type} onChange={(event) => onFieldChange("request_type", event.target.value)}>{membershipRequestTypeOptions.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</SelectField></AdminInformationRow>
        <AdminInformationRow label="Sortierung"><InputField type="number" value={form.sort_order} onChange={(event) => onFieldChange("sort_order", Number(event.target.value || 0))} /></AdminInformationRow>
        <AdminInformationRow label="Aktivität"><label className="inline-flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white/75"><input type="checkbox" checked={form.is_active} onChange={(event) => onFieldChange("is_active", event.target.checked)} />Aktiv</label></AdminInformationRow>
      </AdminInformationSection>
      <Can permission="membership_requests.edit" uiOnly><AdminActionBar className="justify-end"><AdminButton onClick={onReset}>Neuer Empfänger</AdminButton><AdminButton type="submit" variant="primary" disabled={loading}>{loading ? "Speichert..." : "Empfänger speichern"}</AdminButton></AdminActionBar></Can>
    </AdminDetailLayout>
  </form>;
}
