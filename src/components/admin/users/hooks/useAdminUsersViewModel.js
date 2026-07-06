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
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const users = initialData?.users || [];
  const roles = initialData?.roles || [];

  const roleOptions = useMemo(
    () => [{ value: "all", label: "Alle Rollen" }].concat(
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

  function openDetails(userId) {
    setSelectedUserId(userId);
    setIsDetailsOpen(true);
  }

  function closeDetails() {
    setIsDetailsOpen(false);
  }

  return {
    users,
    filteredUsers,
    roles,
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
    isDetailsOpen,
    openDetails,
    closeDetails,
    isNewUserOpen,
    setIsNewUserOpen,
    updatingUserId,
    setUpdatingUserId,
  };
}
