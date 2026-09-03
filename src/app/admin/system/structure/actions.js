"use server";

import { revalidatePath } from "next/cache";
import { assertSuperadminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { isUnassignedStructureRecord, normalizeStructureAssignmentInput, normalizeStructureRelationConflict, validateRelationCompatibility } from "@/components/admin/structure/structureAssignment.core.mjs";
import { assignUnassignedStructureRecord, deactivateStructureRelationConflict, loadActiveDepartment, loadRelatedDepartmentIds, loadStructureRecord, loadStructureRelationConflicts } from "@/components/admin/structure/structureAssignment.repository";

export async function assignUnassignedStructureAction(input) {
  const auth = await assertSuperadminActionPermission();
  if (!auth.ok) return { ok: false, reason: auth.reason, message: "Nur Superadmin darf zentrale Zuordnungen vornehmen." };
  const normalized = normalizeStructureAssignmentInput(input);
  if (!normalized.ok) return normalized;
  const assignment = normalized.data;
  const db = createSupabaseAdminClient();
  if (!db) return { ok: false, message: "Serverseitiger Datenbankzugriff ist nicht konfiguriert." };

  const current = await loadStructureRecord(db, assignment.entityType, assignment.entityId);
  if (current.error || !current.data) return { ok: false, message: "Der Datensatz wurde nicht gefunden." };
  if (!isUnassignedStructureRecord(assignment.entityType, current.data)) return { ok: false, reason: "assignment-conflict", message: "Der Datensatz ist nicht mehr unzugeordnet. Bitte die Ansicht neu laden." };

  if (assignment.targetType === "department") {
    const department = await loadActiveDepartment(db, assignment.departmentId);
    if (department.error || !department.data) return { ok: false, message: "Die Zielabteilung ist nicht aktiv oder existiert nicht." };
    const relations = await loadRelatedDepartmentIds(db, assignment.entityType, assignment.entityId);
    if (relations.error) return { ok: false, message: "Bestehende Relationen konnten nicht geprueft werden." };
    const compatible = validateRelationCompatibility(assignment.departmentId, relations.data);
    if (!compatible.ok) return compatible;
  }

  const result = await assignUnassignedStructureRecord(db, assignment);
  if (result.error) return { ok: false, message: "Die Zuordnung konnte nicht gespeichert werden." };
  if ((result.data || []).length !== 1) return { ok: false, reason: "assignment-conflict", message: "Die Zuordnung wurde zwischenzeitlich geaendert. Bitte neu laden." };

  revalidatePath("/admin/system/structure");
  revalidatePath("/admin/players");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/department");
  return { ok: true, message: "Die organisatorische Zuordnung wurde gespeichert." };
}

export async function removeStructureRelationConflictAction(input = {}) {
  const auth = await assertSuperadminActionPermission();
  if (!auth.ok) return { ok: false, message: "Nur Superadmin darf bestehende Mannschaftszuordnungen lösen." };
  const entityType = ["player", "coach"].includes(input.entityType) ? input.entityType : null;
  const relationId = String(input.relationId || "").trim();
  const entityId = String(input.entityId || "").trim();
  if (!entityType || !relationId || !entityId) return { ok: false, message: "Die Konfliktzuordnung ist ungültig." };
  const db = createSupabaseAdminClient();
  if (!db) return { ok: false, message: "Serverseitiger Datenbankzugriff ist nicht konfiguriert." };
  const conflicts = await loadStructureRelationConflicts(db);
  if (conflicts.error) return { ok: false, message: "Die Zuordnung konnte nicht sicher geprüft werden." };
  const conflictRows = entityType === "player" ? conflicts.data?.players : conflicts.data?.coaches;
  const relation = (conflictRows || []).find((row) => row.id === relationId && row[`${entityType}_id`] === entityId);
  if (!relation || !normalizeStructureRelationConflict(entityType, relation)) {
    return { ok: false, message: "Die Zuordnung ist nicht mehr als Konflikt vorhanden. Bitte neu laden." };
  }
  const result = await deactivateStructureRelationConflict(db, { entityType, relationId, entityId });
  if (result.error) return { ok: false, message: "Die Mannschaftszuordnung konnte nicht gelöst werden." };
  if ((result.data || []).length !== 1) return { ok: false, message: "Die Zuordnung wurde bereits verändert. Bitte neu laden." };
  revalidatePath("/admin/system/structure");
  revalidatePath("/admin/players");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/teams");
  return { ok: true, message: "Die inkompatible Mannschaftszuordnung wurde gelöst. Der Stammdatensatz bleibt erhalten." };
}
