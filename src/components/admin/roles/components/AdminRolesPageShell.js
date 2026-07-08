"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import useAdminRolesViewModel from "../hooks/useAdminRolesViewModel";
import RolesStatsGrid from "./RolesStatsGrid";
import RolesToolbar from "./RolesToolbar";
import RolesTable from "./RolesTable";
import RoleDetailsDialog from "./RoleDetailsDialog";
import RoleEditorDialog from "../forms/RoleEditorDialog";
import {
  saveAdminRoleAction,
  updateAdminRoleStatusAction,
} from "@/app/admin/roles/actions";
import { getAdminRolesPageData } from "../services/roles.service";
import {
  getReadableErrorMessage,
  logAdminDebugError,
} from "@/lib/admin-auth/adminDiagnostics";

export default function AdminRolesPageShell({ initialData }) {
  const router = useRouter();
  const [runtimeData, setRuntimeData] = useState(initialData);
  const vm = useAdminRolesViewModel(runtimeData);

  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshRolesData() {
      try {
        const nextData = await getAdminRolesPageData();
        if (!active) return;
        setRuntimeData(nextData);
      } catch (loadError) {
        if (!active) return;
        logAdminDebugError("admin-roles", loadError);
        setError(
          `Daten konnten nicht geladen werden: ${getReadableErrorMessage(
            loadError,
            "Rollendaten konnten nicht geladen werden.",
          )}`,
        );
      }
    }

    refreshRolesData();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(values) {
    setError("");
    setFormErrors({});
    setSaving(true);

    const result = await saveAdminRoleAction({
      roleId: vm.editingRole?.id || null,
      values,
    });

    if (!result?.ok) {
      setSaving(false);
      setError(result?.message || "Rolle konnte nicht gespeichert werden.");
      setFormErrors(result?.errors || {});
      return;
    }

    setSaving(false);
    vm.closeEditor();
    router.refresh();
  }

  async function handleToggleStatus(roleId, roleKey, isActive) {
    setError("");
    vm.setUpdatingRoleId(roleId);

    const result = await updateAdminRoleStatusAction({
      roleId,
      roleKey,
      isActive,
    });
    if (!result?.ok) {
      vm.setUpdatingRoleId(null);
      setError(
        result?.message || "Rollenstatus konnte nicht aktualisiert werden.",
      );
      return;
    }

    vm.setUpdatingRoleId(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Rollen"
        title="Rollenverwaltung"
        description="Rollen zentral pflegen. Permissions und Benutzerzuweisungen sind in B3 read only sichtbar."
      />

      <RolesStatsGrid stats={vm.stats} />

      <RolesToolbar
        filters={vm.filters}
        statusOptions={vm.statusOptions}
        sortOptions={vm.sortOptions}
        onSearchChange={vm.setSearch}
        onStatusChange={vm.setStatus}
        onSortChange={vm.setSort}
        onCreate={vm.openCreate}
      />

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <RolesTable
        roles={vm.filteredRoles}
        updatingRoleId={vm.updatingRoleId}
        onOpenDetails={vm.openDetails}
        onEdit={vm.openEdit}
        onToggleStatus={handleToggleStatus}
        onCreate={vm.openCreate}
      />

      <RoleDetailsDialog
        role={vm.selectedRole}
        open={vm.isDetailsOpen}
        onClose={vm.closeDetails}
      />

      <RoleEditorDialog
        open={vm.isEditorOpen}
        role={vm.editingRole}
        loading={saving}
        errors={formErrors}
        onClose={vm.closeEditor}
        onSubmit={handleSave}
      />
    </div>
  );
}
