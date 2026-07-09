"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import useAdminUsersViewModel from "../hooks/useAdminUsersViewModel";
import UsersStatsGrid from "./UsersStatsGrid";
import UsersToolbar from "./UsersToolbar";
import UsersTable from "./UsersTable";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import UserEditorDialog from "../dialogs/UserEditorDialog";
import {
  saveAdminUserAction,
  updateAdminUserStatusAction,
} from "@/app/admin/users/actions";
import { getAdminUsersPageData } from "../services/users.service";
import {
  getReadableErrorMessage,
  logAdminDebugError,
} from "@/lib/admin-auth/adminDiagnostics";

export default function AdminUsersPageShell({ initialData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [runtimeData, setRuntimeData] = useState(initialData);

  useEffect(() => {
    let active = true;

    async function refreshUsersData() {
      try {
        const nextData = await getAdminUsersPageData();
        if (!active) return;
        setRuntimeData(nextData);
      } catch (loadError) {
        if (!active) return;
        logAdminDebugError("admin-users", loadError);
        setError(
          `Daten konnten nicht geladen werden: ${getReadableErrorMessage(
            loadError,
            "Benutzerdaten konnten nicht geladen werden.",
          )}`,
        );
      }
    }

    refreshUsersData();

    return () => {
      active = false;
    };
  }, []);

  const vm = useAdminUsersViewModel(runtimeData);

  async function refreshUsersData() {
    const nextData = await getAdminUsersPageData();
    setRuntimeData(nextData);
    router.refresh();
  }

  async function handleToggleStatus(userId, isActive) {
    setError("");
    vm.setUpdatingUserId(userId);

    const result = await updateAdminUserStatusAction({
      userId,
      isActive,
      currentUserId: vm.currentUserId,
    });

    if (!result?.ok) {
      setError(result?.message || "Status konnte nicht aktualisiert werden.");
      vm.setUpdatingUserId(null);
      return;
    }

    vm.setUpdatingUserId(null);
    await refreshUsersData();
  }

  async function handleSubmitUserEditor(values) {
    const result = await saveAdminUserAction({
      userId: vm.editingUser?.id || null,
      values,
      currentUserId: vm.currentUserId,
    });

    if (result?.ok) {
      await refreshUsersData();
    }

    return result;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Benutzer"
        title="Benutzerverwaltung"
        description="Admin-Profile, Rollen und Aktivstatus zentral verwalten. Rechtepruefungen folgen in spaeteren Phasen."
      />

      <UsersStatsGrid stats={vm.stats} />

      <UsersToolbar
        filters={vm.filters}
        statusOptions={vm.statusOptions}
        roleOptions={vm.roleOptions}
        sortOptions={vm.sortOptions}
        onSearchChange={vm.setSearch}
        onStatusChange={vm.setStatus}
        onRoleChange={vm.setRole}
        onSortChange={vm.setSort}
        onOpenNewUser={vm.openCreate}
      />

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <UsersTable
        users={vm.filteredUsers}
        updatingUserId={vm.updatingUserId}
        currentUserId={vm.currentUserId}
        onOpenDetails={vm.openDetails}
        onEditUser={vm.openEdit}
        onToggleStatus={handleToggleStatus}
        onCreate={vm.openCreate}
      />

      <UserDetailsDialog
        user={vm.selectedUser}
        open={vm.isDetailsOpen}
        onClose={vm.closeDetails}
      />

      <UserEditorDialog
        open={vm.isEditorOpen}
        mode={vm.editingUser ? "edit" : "create"}
        user={vm.editingUser}
        roles={vm.roles || []}
        currentUserId={vm.currentUserId}
        createCapabilities={vm.createCapabilities}
        onSubmit={handleSubmitUserEditor}
        onClose={vm.closeEditor}
      />
    </div>
  );
}
