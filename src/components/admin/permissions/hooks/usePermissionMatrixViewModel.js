"use client";

import { useMemo, useState } from "react";

export default function usePermissionMatrixViewModel(initialData) {
  const [query, setQuery] = useState("");

  const roles = initialData?.roles || [];
  const groupedPermissions = initialData?.groupedPermissions || {};

  const assignments = useMemo(
    () => new Set(initialData?.linkSet || []),
    [initialData?.linkSet],
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return groupedPermissions;

    return Object.keys(groupedPermissions).reduce((acc, category) => {
      const matches = (groupedPermissions[category] || []).filter(
        (permission) =>
          [permission.name, permission.key, permission.description]
            .map((value) => (value || "").toLowerCase())
            .some((value) => value.includes(normalized)),
      );

      if (matches.length) {
        acc[category] = matches;
      }

      return acc;
    }, {});
  }, [groupedPermissions, query]);

  return {
    roles,
    query,
    setQuery,
    assignments,
    groupedPermissions: filteredGroups,
  };
}
