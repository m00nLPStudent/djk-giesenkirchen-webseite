"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import useAdminPermissionsViewModel from "../hooks/useAdminPermissionsViewModel";
import PermissionsStatsGrid from "./PermissionsStatsGrid";
import PermissionsToolbar from "./PermissionsToolbar";
import PermissionsTable from "./PermissionsTable";
import PermissionDetailsDialog from "./PermissionDetailsDialog";
import PermissionEditorDialog from "../forms/PermissionEditorDialog";
import { saveAdminPermissionAction } from "@/app/admin/permissions/actions";

export default function AdminPermissionsPageShell({ initialData }) {
  const router = useRouter();
  const vm = useAdminPermissionsViewModel(initialData);

  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function handleSave(values) {
    setError("");
    setFormErrors({});
    setSaving(true);

    const result = await saveAdminPermissionAction({
      permissionId: vm.editingPermission?.id || null,
      values,
    });

    setSaving(false);

    if (!result?.ok) {
      setError(result?.message || "Permission konnte nicht gespeichert werden.");
      setFormErrors(result?.errors || {});
      return;
    }

    vm.closeEditor();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Permissions"
        title="Permission-Verwaltung"
        description="Permissions zentral pflegen und fuer die Matrix vorbereiten. Enforcement folgt in spaeteren Phasen."
      />

      <PermissionsStatsGrid stats={vm.stats} />

      <PermissionsToolbar
        filters={vm.filters}
        categoryOptions={vm.categoryOptions}
        sortOptions={vm.sortOptions}
        onSearchChange={vm.setSearch}
        onCategoryChange={vm.setCategory}
        onSortChange={vm.setSort}
        onCreate={vm.openCreate}
      />

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <PermissionsTable
        permissions={vm.filteredPermissions}
        onOpenDetails={vm.openDetails}
        onEdit={vm.openEdit}
        onCreate={vm.openCreate}
      />

      <PermissionDetailsDialog
        permission={vm.selectedPermission}
        open={vm.isDetailsOpen}
        onClose={vm.closeDetails}
      />

      <PermissionEditorDialog
        open={vm.isEditorOpen}
        permission={vm.editingPermission}
        loading={saving}
        errors={formErrors}
        onClose={vm.closeEditor}
        onSubmit={handleSave}
      />
    </div>
  );
}
