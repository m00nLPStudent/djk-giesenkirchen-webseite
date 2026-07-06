"use client";

import { useEffect, useState } from "react";
import RoleEditorForm from "./RoleEditorForm";

function getInitialValues(role) {
  return {
    name: role?.name || "",
    key: role?.key || "",
    description: role?.description || "",
    sort_order: role?.sort_order ?? 0,
    is_active: role?.is_active !== false,
    keyTouched: Boolean(role?.key),
  };
}

export default function RoleEditorDialog({
  open,
  role,
  loading,
  errors,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(getInitialValues(role));

  useEffect(() => {
    setValues(getInitialValues(role));
  }, [role, open]);

  if (!open) return null;

  function handlePatch(patch) {
    setValues((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <div className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-5 md:max-h-[85vh] md:overflow-y-auto md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">
              Rollenverwaltung
            </p>
            <h3 className="mt-1 text-2xl font-black text-white">
              {role ? "Rolle bearbeiten" : "Neue Rolle"}
            </h3>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-bold text-white/75"
            >
              Schliessen
            </button>
          </div>
        </div>

        <div className="mt-5">
          <RoleEditorForm
            values={values}
            errors={errors || {}}
            onChange={handlePatch}
          />
        </div>

        <div className="mt-6 grid gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-bold text-white/80 sm:w-auto"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onSubmit(values)}
            className="h-10 w-full rounded-xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
          >
            {loading ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
