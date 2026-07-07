"use client";

import { useMemo, useState } from "react";
import { applyPermissionsFilters } from "../helpers/permissions.filters";

export const PERMISSION_SORT_OPTIONS = [
  { value: "created_desc", label: "Neueste zuerst" },
  { value: "created_asc", label: "Aelteste zuerst" },
  { value: "category_asc", label: "Kategorie A-Z" },
  { value: "category_desc", label: "Kategorie Z-A" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "key_asc", label: "Key A-Z" },
  { value: "key_desc", label: "Key Z-A" },
];

export default function useAdminPermissionsViewModel(initialData) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("created_desc");

  const [selectedPermissionId, setSelectedPermissionId] = useState(null);
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const permissions = initialData?.permissions || [];
  const categories = initialData?.categories || [];

  const filteredPermissions = useMemo(
    () => applyPermissionsFilters(permissions, { search, category, sort }),
    [permissions, search, category, sort],
  );

  const selectedPermission = useMemo(
    () =>
      permissions.find((permission) => permission.id === selectedPermissionId) ||
      null,
    [permissions, selectedPermissionId],
  );

  const editingPermission = useMemo(
    () =>
      permissions.find((permission) => permission.id === editingPermissionId) ||
      null,
    [permissions, editingPermissionId],
  );

  return {
    permissions,
    filteredPermissions,
    stats: initialData?.stats,
    categories,
    filters: { search, category, sort },
    setSearch,
    setCategory,
    setSort,
    sortOptions: PERMISSION_SORT_OPTIONS,
    categoryOptions: [{ value: "all", label: "Alle Kategorien" }].concat(
      categories.map((item) => ({ value: item, label: item })),
    ),
    selectedPermission,
    editingPermission,
    isDetailsOpen,
    isEditorOpen,
    openDetails: (permissionId) => {
      setSelectedPermissionId(permissionId);
      setIsDetailsOpen(true);
    },
    closeDetails: () => setIsDetailsOpen(false),
    openCreate: () => {
      setEditingPermissionId(null);
      setIsEditorOpen(true);
    },
    openEdit: (permissionId) => {
      setEditingPermissionId(permissionId);
      setIsEditorOpen(true);
    },
    closeEditor: () => setIsEditorOpen(false),
  };
}
