"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminModuleHeader, AdminModulePage } from "@/components/admin/design-system";
import useAdminRolesViewModel from "../hooks/useAdminRolesViewModel";
import RolesStatsGrid from "./RolesStatsGrid";
import RolesToolbar from "./RolesToolbar";
import RolesTable from "./RolesTable";
import RoleDetailsDialog from "./RoleDetailsDialog";
import RoleEditorDialog from "../forms/RoleEditorDialog";
import AdminLoginRequiredNotice from "@/components/admin/common/AdminLoginRequiredNotice";
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
  const [notice, setNotice] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshRolesData() {
      try {
        const nextData = await getAdminRolesPageData();
        if (!active) return;
        setRuntimeData(nextData);

        if (nextData?.loadState?.status === "auth-pending") {
          setNotice("Authentifizierung wird initialisiert ...");
          setError("");
          return;
        }

        if (nextData?.loadState?.status === "no-session") {
          setNotice("");
          setError("");
          return;
        }

        setNotice("");
        setError("");
      } catch (loadError) {
        if (!active) return;
        logAdminDebugError("admin-roles", loadError);
        setNotice("");
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

  if (runtimeData?.loadState?.status === "no-session") {
    return (
      <AdminModulePage>
        <AdminModuleHeader
          eyebrow="Rollen"
          title="Rollenverwaltung"
          description="Rollen zentral pflegen."
        />
        <AdminLoginRequiredNotice />
      </AdminModulePage>
    );
  }

  return (
    <AdminModulePage>
      <RolesToolbar
        filters={vm.filters}
        statusOptions={vm.statusOptions}
        sortOptions={vm.sortOptions}
        onSearchChange={vm.setSearch}
        onStatusChange={vm.setStatus}
        onSortChange={vm.setSort}
        onCreate={vm.openCreate}
      />

      <RolesStatsGrid stats={vm.stats} />

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      {!error && notice && (
        <p className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {notice}
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
        onEdit={vm.openEdit}
        onToggleStatus={handleToggleStatus}
        isUpdating={vm.updatingRoleId === vm.selectedRole?.id}
      />

      <RoleEditorDialog
        open={vm.isEditorOpen}
        role={vm.editingRole}
        loading={saving}
        errors={formErrors}
        onClose={vm.closeEditor}
        onSubmit={handleSave}
      />
    </AdminModulePage>
  );
}
