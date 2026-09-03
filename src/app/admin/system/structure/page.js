import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import StructureAssignmentModule from "@/components/admin/structure/StructureAssignmentModule";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadStructureInventory, loadStructureRelationConflicts } from "@/components/admin/structure/structureAssignment.repository";
import { normalizeStructureRelationConflict } from "@/components/admin/structure/structureAssignment.core.mjs";

export const dynamic = "force-dynamic";

function name(first, last, fallback) {
  return [first, last].filter(Boolean).join(" ") || fallback || "Ohne Bezeichnung";
}

export default async function StructureAssignmentPage() {
  const auth = await assertSuperadminActionPermission();
  if (!auth.ok) redirect(`/admin/unauthorized?reason=${auth.reason}`);
  const db = createSupabaseAdminClient();
  if (!db) return <AdminLayout title="Struktur & Zuordnung" subtitle="System" showHeader={false}><StructureAssignmentModule loadError="Serverseitiger Datenbankzugriff ist nicht konfiguriert." /></AdminLayout>;
  const [result, conflictsResult] = await Promise.all([loadStructureInventory(db), loadStructureRelationConflicts(db)]);
  const departmentById = new Map((result.data?.departments || []).map((item) => [item.id, item]));
  const items = result.data ? [
    ...result.data.players.map((item) => ({ ...item, type: "player", typeLabel: "Spieler", label: name(item.first_name, item.last_name), href: `/admin/players/${item.id}`, scope: item.department_id ? "department" : "unassigned" })),
    ...result.data.coaches.map((item) => ({ ...item, type: "coach", typeLabel: "Trainer", label: name(item.first_name, item.last_name, item.name), href: `/admin/coaches/edit/${item.id}`, scope: item.department_id ? "department" : "unassigned" })),
    ...result.data.teams.map((item) => ({ ...item, type: "team", typeLabel: "Mannschaft", label: item.name_de || item.slug || "Ohne Bezeichnung", href: `/admin/teams/${item.id}`, scope: item.department_id ? "department" : "unassigned" })),
    ...result.data.board.map((item) => ({ ...item, type: "board", typeLabel: "Vorstand", label: name(item.first_name, item.last_name, item.role_de), href: `/admin/department/board/edit/${item.id}`, scope: item.organization_scope })),
  ].map((item) => ({ ...item, departmentLabel: departmentById.get(item.department_id)?.name_de || departmentById.get(item.department_id)?.slug || null })) : [];
  const conflicts = conflictsResult.data ? [
    ...(conflictsResult.data.players || []).map((row) => normalizeStructureRelationConflict("player", row)),
    ...(conflictsResult.data.coaches || []).map((row) => normalizeStructureRelationConflict("coach", row)),
  ].filter(Boolean) : [];
  return <AdminLayout title="Struktur & Zuordnung" subtitle="System" showHeader={false}><StructureAssignmentModule items={items} departments={(result.data?.departments || []).filter((item) => item.is_active)} conflicts={conflicts} loadError={result.error || conflictsResult.error ? "Strukturdaten konnten nicht geladen werden." : null} /></AdminLayout>;
}
