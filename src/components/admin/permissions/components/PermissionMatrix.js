"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import { canRenderAdminUiItem } from "@/lib/admin-auth/adminUiVisibility";
import {
  AdminButton,
  AdminModuleHeader,
  AdminModulePage,
  AdminModuleSearch,
} from "@/components/admin/design-system";
import AdminLoginRequiredNotice from "@/components/admin/common/AdminLoginRequiredNotice";
import { toggleRolePermissionAction } from "@/app/admin/permissions/actions";
import usePermissionMatrixViewModel from "../hooks/usePermissionMatrixViewModel";
import PermissionMatrixCategory from "./PermissionMatrixCategory";
import { getPermissionMatrixPageData } from "../services/permissions.service";
import {
  getReadableErrorMessage,
  logAdminDebugError,
} from "@/lib/admin-auth/adminDiagnostics";

export default function PermissionMatrix({ initialData }) {
  const [runtimeData, setRuntimeData] = useState(initialData);
  const vm = usePermissionMatrixViewModel(runtimeData);
  const router = useRouter();
  const { userContext } = useAdminUiContext();
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function refreshMatrixData() {
      try {
        const nextData = await getPermissionMatrixPageData();
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
        logAdminDebugError("admin-permissions-matrix", loadError);
        setNotice("");
        setError(
          `Daten konnten nicht geladen werden: ${getReadableErrorMessage(
            loadError,
            "Matrixdaten konnten nicht geladen werden.",
          )}`,
        );
      }
    }

    refreshMatrixData();

    return () => {
      active = false;
    };
  }, []);

  async function handleToggle({ roleId, permissionId, checked }) {
    setError("");
    const key = `${roleId}:${permissionId}`;
    setBusyKey(key);

    const result = await toggleRolePermissionAction({
      roleId,
      permissionId,
      checked,
    });
    setBusyKey("");

    if (!result?.ok) {
      setError(
        result?.message || "Matrix-Zuordnung konnte nicht gespeichert werden.",
      );
      return;
    }

    router.refresh();
  }

  const categories = Object.keys(vm.groupedPermissions).sort((a, b) =>
    a.localeCompare(b, "de-DE"),
  );
  const canEditMatrix = canRenderAdminUiItem(userContext, "permissions.edit");

  if (runtimeData?.loadState?.status === "no-session") {
    return (
      <AdminModulePage className="overflow-x-hidden">
        <AdminModuleHeader
          eyebrow="Permissions"
          title="Rollen-Permission-Matrix"
          description="Zuordnungen zwischen Rollen und Permissions verwalten."
        />
        <AdminLoginRequiredNotice />
      </AdminModulePage>
    );
  }

  return (
    <AdminModulePage className="overflow-x-hidden">
      <AdminModuleHeader
        eyebrow="Permissions"
        title="Rollen-Permission-Matrix"
        description="Rollenzuordnungen der bestehenden Permissions verwalten."
        actions={
          <AdminButton href="/admin/permissions">
            Zur Permissions-Liste
          </AdminButton>
        }
      >
        <AdminModuleSearch
          value={vm.query}
          onChange={(event) => vm.setQuery(event.target.value)}
          placeholder="Permission nach Name oder Key suchen"
          label="Permission-Matrix durchsuchen"
        />
      </AdminModuleHeader>

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

      <div className="space-y-5 overflow-x-hidden">
        {categories.map((category) => (
          <PermissionMatrixCategory
            key={category}
            category={category}
            permissions={vm.groupedPermissions[category] || []}
            roles={vm.roles}
            assignments={vm.assignments}
            canEdit={canEditMatrix}
            onToggle={handleToggle}
            busyKey={busyKey}
          />
        ))}
      </div>
    </AdminModulePage>
  );
}
