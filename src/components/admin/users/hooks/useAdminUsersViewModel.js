"use client";

import { useMemo, useState } from "react";
import { applyUsersFilters } from "../helpers/users.filters";
import { USER_SORT_OPTIONS, USER_STATUS_OPTIONS } from "../users.constants";

export default function useAdminUsersViewModel(initialData) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState("name_asc");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const users = initialData?.users || [];
  const roles = initialData?.roles || [];
  const currentUserId = initialData?.currentUserId || null;
  const createCapabilities = initialData?.createCapabilities || {
    serviceRoleEnabled: false,
    createFlowEnabled: false,
  };

  const roleOptions = useMemo(
    () =>
      [{ value: "all", label: "Alle Rollen" }].concat(
        roles.map((item) => ({ value: item.id, label: item.name })),
      ),
    [roles],
  );

  const filteredUsers = useMemo(
    () => applyUsersFilters(users, { search, status, role, sort }),
    [users, search, status, role, sort],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) || null,
    [users, editingUserId],
  );

  function openDetails(userId) {
    setSelectedUserId(userId);
    setIsDetailsOpen(true);
  }

  function closeDetails() {
    setIsDetailsOpen(false);
  }

  function openCreate() {
    setEditingUserId(null);
    setIsEditorOpen(true);
  }

  function openEdit(userId) {
    setEditingUserId(userId);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setEditingUserId(null);
    setIsEditorOpen(false);
  }

  return {
    users,
    filteredUsers,
    roles,
    currentUserId,
    createCapabilities,
    stats: initialData?.stats,
    filters: {
      search,
      status,
      role,
      sort,
    },
    setSearch,
    setStatus,
    setRole,
    setSort,
    statusOptions: USER_STATUS_OPTIONS,
    sortOptions: USER_SORT_OPTIONS,
    roleOptions,
    selectedUser,
    editingUser,
    isDetailsOpen,
    openDetails,
    closeDetails,
    isEditorOpen,
    openCreate,
    openEdit,
    closeEditor,
    updatingUserId,
    setUpdatingUserId,
  };
}
