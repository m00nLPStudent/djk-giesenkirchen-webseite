"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Network } from "lucide-react";
import AdminCard from "@/components/admin/common/AdminCard";
import { AdminButton, AdminModuleEmptyState, AdminModuleHeader, AdminModulePage, AdminStatusChip } from "@/components/admin/design-system";
import { assignUnassignedStructureAction, removeStructureRelationConflictAction } from "@/app/admin/system/structure/actions";

const TYPE_OPTIONS = [["all", "Alle Typen"], ["player", "Spieler"], ["coach", "Trainer"], ["team", "Mannschaften"], ["board", "Vorstand"]];

function AssignmentControl({ item, departments, pending, onAssign }) {
  const [target, setTarget] = useState("");
  if (item.scope !== "unassigned") return <span className="text-xs text-white/40">Bereits zugeordnet</span>;
  return <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
    <select aria-label={`Ziel fuer ${item.label}`} value={target} onChange={(event) => setTarget(event.target.value)} className="min-h-10 min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white">
      <option value="">Ziel auswählen</option>
      {item.type === "board" ? <option value="club">Gesamtverein</option> : null}
      {departments.map((department) => <option key={department.id} value={department.id}>{department.name_de || department.slug}</option>)}
    </select>
    <AdminButton type="button" disabled={pending || !target} onClick={() => onAssign(item, target)}>Zuordnen</AdminButton>
  </div>;
}

export default function StructureAssignmentModule({ items = [], departments = [], conflicts = [], loadError = null }) {
  const router = useRouter();
  const [type, setType] = useState("all");
  const [scope, setScope] = useState("unassigned");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => items.filter((item) => (type === "all" || item.type === type) && (scope === "all" || item.scope === scope || (scope === "assigned" && item.scope !== "unassigned"))), [items, type, scope]);
  const counts = Object.fromEntries(TYPE_OPTIONS.slice(1).map(([key]) => [key, items.filter((item) => item.type === key && item.scope === "unassigned").length]));
  const assign = (item, target) => startTransition(async () => {
    setMessage("");
    const result = await assignUnassignedStructureAction({ entityType: item.type, entityId: item.id, targetType: target === "club" ? "club" : "department", departmentId: target === "club" ? null : target });
    setMessage(result.message || (result.ok ? "Zuordnung gespeichert." : "Zuordnung fehlgeschlagen."));
    if (result.ok) router.refresh();
  });
  const removeConflict = (conflict) => startTransition(async () => {
    setMessage("");
    const result = await removeStructureRelationConflictAction({ entityType: conflict.entityType, relationId: conflict.id, entityId: conflict.entityId });
    setMessage(result.message || (result.ok ? "Zuordnung gelöst." : "Zuordnung konnte nicht gelöst werden."));
    if (result.ok) router.refresh();
  });

  return <AdminModulePage>
    <AdminModuleHeader eyebrow="System" title="Struktur & Zuordnung" description="Zentrale organisatorische Stammdaten verwalten. Bestehende nicht zugeordnete Datensätze dürfen ausschließlich durch Superadmin zugeordnet werden." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{TYPE_OPTIONS.slice(1).map(([key, label]) => <AdminCard key={key} className="p-4"><p className="text-xs uppercase tracking-wider text-white/45">Nicht zugeordnet</p><p className="mt-1 text-lg font-black text-white">{counts[key]} {label}</p></AdminCard>)}</div>
    <AdminCard className="flex flex-col gap-3 p-4 sm:flex-row"><select aria-label="Typ filtern" value={type} onChange={(event) => setType(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white">{TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Zuordnung filtern" value={scope} onChange={(event) => setScope(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"><option value="unassigned">Nicht zugeordnet</option><option value="assigned">Zugeordnet</option><option value="all">Alle</option><option value="club">Gesamtverein</option><option value="department">Abteilung</option></select></AdminCard>
    {message ? <p role="status" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">{message}</p> : null}
    {loadError ? <AdminModuleEmptyState icon={Network} title="Strukturdaten nicht verfügbar" description={loadError} /> : filtered.length === 0 ? <AdminModuleEmptyState icon={Network} title="Keine passenden Datensätze" description="Für den gewählten Filter liegen keine Einträge vor." /> : <AdminCard className="overflow-hidden p-0"><div className="hidden grid-cols-[minmax(12rem,1fr)_8rem_minmax(10rem,.8fr)_minmax(16rem,1fr)] gap-4 border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40 lg:grid"><span>Datensatz</span><span>Typ</span><span>Zuordnung</span><span>Aktion</span></div><div className="divide-y divide-white/10">{filtered.map((item) => <div key={`${item.type}-${item.id}`} className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(12rem,1fr)_8rem_minmax(10rem,.8fr)_minmax(16rem,1fr)] lg:items-center"><div className="min-w-0"><Link href={item.href} className="font-bold text-white hover:text-red-300">{item.label}</Link>{item.is_active === false ? <p className="mt-1 text-xs text-amber-300">Inaktiv</p> : null}</div><span className="text-sm text-white/60">{item.typeLabel}</span><div><AdminStatusChip variant={item.scope === "unassigned" ? "warning" : "success"}>{item.scope === "unassigned" ? "Nicht zugeordnet" : item.scope === "club" ? "Gesamtverein" : item.departmentLabel || "Abteilung"}</AdminStatusChip></div><AssignmentControl item={item} departments={departments} pending={pending} onAssign={assign} /></div>)}</div></AdminCard>}
    <AdminCard className="overflow-hidden p-0"><div className="border-b border-white/10 px-4 py-4"><h2 className="font-black text-white">Zuordnungskonflikte</h2><p className="mt-1 text-sm text-white/55">Inkompatible Legacy-Mannschaftsrelationen werden nicht als gültiger Kader behandelt und niemals automatisch migriert.</p></div>{conflicts.length === 0 ? <p className="px-4 py-5 text-sm text-white/50">Keine Zuordnungskonflikte vorhanden.</p> : <div className="divide-y divide-white/10">{conflicts.map((conflict) => <div key={`${conflict.entityType}-${conflict.id}`} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(16rem,1.4fr)_auto] lg:items-center"><div><p className="font-bold text-white">{conflict.label}</p><p className="text-xs text-white/45">{conflict.entityType === "player" ? "Spieler" : "Trainer"} · {conflict.personDepartmentLabel}</p></div><div className="text-sm text-white/65">{conflict.teamName}<p className="text-xs text-white/40">{conflict.teamDepartmentLabel}</p></div><p className="text-sm text-amber-200">{conflict.reason}</p><AdminButton type="button" disabled={pending} onClick={() => removeConflict(conflict)}>Mannschaftszuordnung lösen</AdminButton></div>)}</div>}</AdminCard>
  </AdminModulePage>;
}
