"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField, SelectField } from "@/components/admin/forms";
import { AdminActionBar, AdminButton, AdminDangerZone, AdminDetailHeader, AdminDetailLayout, AdminInformationRow, AdminInformationSection, AdminStatusChip } from "@/components/admin/design-system";
import { deleteTeamTypeAction, saveTeamTypeAction } from "@/app/admin/settings/team-types/actions";
import { createTeamTypeForm, getTeamTypeMutationErrorMessage } from "./teamTypes.core";

export default function TeamTypeEditor({ initialTeamType = null, isUsed = false, departments = [] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => createTeamTypeForm(initialTeamType));
  const [loading, setLoading] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault(); setLoading(true);
    const result = await saveTeamTypeAction(form, initialTeamType?.id);
    setLoading(false);
    if (result.error) return alert(result.error.message || getTeamTypeMutationErrorMessage(result.error));
    alert("Mannschaftsvorlage gespeichert."); router.replace(`/admin/settings/team-types/edit/${result.data.id}`); router.refresh();
  }

  async function remove() {
    if (!initialTeamType || isUsed || !window.confirm("Mannschaftsvorlage wirklich löschen?")) return;
    const result = await deleteTeamTypeAction(initialTeamType.id, initialTeamType);
    if (result.error) return alert(result.used ? result.error.message : getTeamTypeMutationErrorMessage(result.error));
    alert("Mannschaftsvorlage gelöscht."); router.replace("/admin/settings/team-types");
  }

  const danger = initialTeamType ? <AdminDangerZone title="Mannschaftsvorlage löschen" description={isUsed ? "Diese Mannschaftsvorlage wird bereits verwendet und kann nicht gelöscht werden. Deaktiviere sie stattdessen." : "Die ungenutzte Mannschaftsvorlage wird dauerhaft entfernt."}>{isUsed ? <AdminStatusChip variant="warning">Nur deaktivierbar</AdminStatusChip> : <AdminButton type="button" variant="danger" onClick={remove}>Vorlage löschen</AdminButton>}</AdminDangerZone> : null;

  return <form onSubmit={submit}><AdminDetailLayout header={<AdminDetailHeader backHref="/admin/settings/team-types" backLabel="Zurück zu Mannschaftsvorlagen" backVariant="pill" eyebrow="Einstellungen" title={initialTeamType ? form.name_de : "Neue Mannschaftsvorlage"} status={<AdminStatusChip variant={form.is_active ? "success" : "warning"}>{form.is_active ? "Aktiv" : "Inaktiv"}</AdminStatusChip>} meta={form.slug ? form.slug.toUpperCase() : "Neue Vorlage"} />} dangerZone={danger}><AdminInformationSection title="Stammdaten"><AdminInformationRow label="Bezeichnung"><InputField label="Interne Bezeichnung" required value={form.slug} onChange={(event) => update("slug", event.target.value)} className="h-11" /></AdminInformationRow><AdminInformationRow label="Anzeigename"><InputField label="Anzeigename" required value={form.name_de} onChange={(event) => update("name_de", event.target.value)} className="h-11" /></AdminInformationRow><AdminInformationRow label="Altersklasse"><InputField label="Altersklasse" required value={form.age_group} onChange={(event) => update("age_group", event.target.value)} className="h-11" /></AdminInformationRow><AdminInformationRow label="Abteilung"><SelectField label="Abteilung" required value={form.department_id} onChange={(event) => update("department_id", event.target.value)}><option value="">Abteilung auswählen</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name_de || department.name || department.slug}</option>)}</SelectField></AdminInformationRow><AdminInformationRow label="Verwaltung"><div className="grid gap-4 sm:grid-cols-2"><InputField label="Sortierung" type="number" value={form.sort_order} onChange={(event) => update("sort_order", Number(event.target.value || 0))} className="h-11" /><label className="flex min-h-11 items-center gap-3 self-end rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white/75"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} />Aktiv</label></div></AdminInformationRow></AdminInformationSection><AdminActionBar className="justify-end"><AdminButton type="submit" variant="primary" disabled={loading}>{loading ? "Speichert..." : "Mannschaftsvorlage speichern"}</AdminButton></AdminActionBar></AdminDetailLayout></form>;
}
