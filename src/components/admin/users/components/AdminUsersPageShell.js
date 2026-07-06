"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import useAdminUsersViewModel from "../hooks/useAdminUsersViewModel";
import UsersStatsGrid from "./UsersStatsGrid";
import UsersToolbar from "./UsersToolbar";
import UsersTable from "./UsersTable";
import UserDetailsDialog from "../dialogs/UserDetailsDialog";
import NewUserDialog from "../dialogs/NewUserDialog";
import { updateAdminUserStatusAction } from "@/app/admin/users/actions";

export default function AdminUsersPageShell({ initialData }) {
  const router = useRouter();
  const [error, setError] = useState("");

  const vm = useAdminUsersViewModel(initialData);

  async function handleToggleStatus(userId, isActive) {
    setError("");
    vm.setUpdatingUserId(userId);

    const result = await updateAdminUserStatusAction({ userId, isActive });

    if (!result?.ok) {
      setError(result?.message || "Status konnte nicht aktualisiert werden.");
      vm.setUpdatingUserId(null);
      return;
    }

    vm.setUpdatingUserId(null);
    router.refresh();
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
        onOpenNewUser={() => vm.setIsNewUserOpen(true)}
      />

      {error && (
        <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <UsersTable
        users={vm.filteredUsers}
        updatingUserId={vm.updatingUserId}
        onOpenDetails={vm.openDetails}
        onToggleStatus={handleToggleStatus}
        onCreate={() => vm.setIsNewUserOpen(true)}
      />

      <UserDetailsDialog
        user={vm.selectedUser}
        open={vm.isDetailsOpen}
        onClose={vm.closeDetails}
      />

      <NewUserDialog
        open={vm.isNewUserOpen}
        roles={vm.roles}
        onClose={() => vm.setIsNewUserOpen(false)}
      />
    </div>
  );
}
