"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/layout/AdminPageHeader";
import AdminPanel from "@/components/admin/common/AdminPanel";
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
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authRetryCount, setAuthRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function refreshMatrixData() {
      try {
        const nextData = await getPermissionMatrixPageData();
        if (!active) return;
        setRuntimeData(nextData);

        if (nextData?.loadState?.status === "no-session") {
          setNotice("Keine aktive Session gefunden. Daten werden geladen, sobald die Anmeldung initialisiert ist.");
          setError("");
          if (authRetryCount < 2) {
            window.setTimeout(() => {
              setAuthRetryCount((count) => count + 1);
            }, 700);
          }
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
  }, [authRetryCount]);

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

  return (
    <div className="space-y-8 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Permissions"
        title="Rollen-Permission-Matrix"
        description="Zuordnungen zwischen Rollen und Permissions pflegen. Die Zuordnungen werden in B4 gespeichert, aber noch nicht systemweit enforced."
        actions={
          <Link
            href="/admin/permissions"
            className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/80"
          >
            Zur Permissions-Liste
          </Link>
        }
      />

      <AdminPanel>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Suche
          </span>
          <input
            type="search"
            value={vm.query}
            onChange={(event) => vm.setQuery(event.target.value)}
            placeholder="Permission nach Name oder Key suchen"
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          />
        </label>
      </AdminPanel>

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
            onToggle={handleToggle}
            busyKey={busyKey}
          />
        ))}
      </div>
    </div>
  );
}
