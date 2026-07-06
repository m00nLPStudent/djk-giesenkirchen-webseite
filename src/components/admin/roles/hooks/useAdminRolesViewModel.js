"use client";

import { useMemo, useState } from "react";
import { applyRolesFilters } from "../helpers/roles.filters";

export const ROLE_STATUS_OPTIONS = [
  { value: "all", label: "Alle Status" },
  { value: "active", label: "Aktive Rollen" },
  { value: "inactive", label: "Inaktive Rollen" },
];

export const ROLE_SORT_OPTIONS = [
  { value: "created_desc", label: "Neueste zuerst" },
  { value: "created_asc", label: "Aelteste zuerst" },
  { value: "sort_asc", label: "Sortierung aufsteigend" },
  { value: "sort_desc", label: "Sortierung absteigend" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

export default function useAdminRolesViewModel(initialData) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created_desc");

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const roles = initialData?.roles || [];

  const filteredRoles = useMemo(
    () => applyRolesFilters(roles, { search, status, sort }),
    [roles, search, status, sort],
  );

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId) || null,
    [roles, editingRoleId],
  );

  function openDetails(roleId) {
    setSelectedRoleId(roleId);
    setIsDetailsOpen(true);
  }

  function openCreate() {
    setEditingRoleId(null);
    setIsEditorOpen(true);
  }

  function openEdit(roleId) {
    setEditingRoleId(roleId);
    setIsEditorOpen(true);
  }

  return {
    roles,
    filteredRoles,
    stats: initialData?.stats,
    filters: { search, status, sort },
    setSearch,
    setStatus,
    setSort,
    statusOptions: ROLE_STATUS_OPTIONS,
    sortOptions: ROLE_SORT_OPTIONS,
    selectedRole,
    editingRole,
    isDetailsOpen,
    isEditorOpen,
    updatingRoleId,
    setUpdatingRoleId,
    openDetails,
    closeDetails: () => setIsDetailsOpen(false),
    openCreate,
    openEdit,
    closeEditor: () => setIsEditorOpen(false),
  };
}
