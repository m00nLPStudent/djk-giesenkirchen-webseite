"use client";

import { useEffect, useMemo, useState } from "react";

function toRoleOptions(roles = []) {
  const active = (roles || []).filter((role) => role?.is_active);
  const inactive = (roles || []).filter((role) => !role?.is_active);
  const seen = new Set();
  return [...active, ...inactive].filter((role) => {
    if (!role?.id || seen.has(role.id)) return false;
    seen.add(role.id);
    return true;
  });
}

function uniqueRoleIds(roleIds = []) {
  return Array.from(
    new Set(
      (roleIds || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export default function UserEditorForm({
  mode,
  roles,
  initialValues,
  loading,
  currentUserId,
  selfSuperadminRoleId,
  onSubmit,
  message,
  formErrors,
}) {
  const [values, setValues] = useState(initialValues);
  const roleOptions = useMemo(() => toRoleOptions(roles), [roles]);
  const availableAdditionalOptions = useMemo(
    () => roleOptions.filter((role) => role.id !== values.primary_role_id),
    [roleOptions, values.primary_role_id],
  );

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handlePrimaryRoleChange(primaryRoleId) {
    setValues((current) => ({
      ...current,
      primary_role_id: primaryRoleId,
      additional_role_ids: uniqueRoleIds(current.additional_role_ids).filter(
        (roleId) => roleId !== primaryRoleId,
      ),
    }));
  }

  function handleAdditionalRoles(event) {
    const selected = uniqueRoleIds(
      Array.from(event.target.selectedOptions).map((option) => option.value),
    );
    setValues((current) => ({
      ...current,
      additional_role_ids: selected.filter(
        (roleId) => roleId !== current.primary_role_id,
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(values);
  }

  const isEditingSelf =
    mode === "edit" && values?.id && currentUserId === values.id;
  const lockOwnSuperadmin = Boolean(isEditingSelf && selfSuperadminRoleId);

  useEffect(() => {
    if (!lockOwnSuperadmin) return;

    setValues((current) => ({
      ...current,
      primary_role_id: selfSuperadminRoleId,
      additional_role_ids: uniqueRoleIds(current.additional_role_ids).filter(
        (roleId) => roleId !== selfSuperadminRoleId,
      ),
    }));
  }, [lockOwnSuperadmin, selfSuperadminRoleId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          Name
        </span>
        <input
          type="text"
          value={values.full_name}
          onChange={(event) => handleChange("full_name", event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
        />
        {formErrors?.full_name ? (
          <p className="text-xs text-red-200">{formErrors.full_name}</p>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
          E-Mail
        </span>
        <input
          type="email"
          value={values.email}
          readOnly={mode === "edit"}
          onChange={(event) => handleChange("email", event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
        />
        {formErrors?.email ? (
          <p className="text-xs text-red-200">{formErrors.email}</p>
        ) : null}
      </label>

      <label className="inline-flex items-center gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={values.is_active}
          disabled={isEditingSelf}
          onChange={(event) => handleChange("is_active", event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/30"
        />
        Aktiv
      </label>

      {isEditingSelf ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Eigener Benutzer kann hier nicht deaktiviert werden.
        </p>
      ) : null}

      {lockOwnSuperadmin ? (
        <p className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Eigene Superadmin-Rolle kann hier nicht entfernt werden.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Primaere Rolle
          </span>
          <select
            value={values.primary_role_id}
            disabled={lockOwnSuperadmin}
            onChange={(event) => handlePrimaryRoleChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white"
          >
            <option value="" className="bg-slate-900">
              Bitte auswaehlen
            </option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id} className="bg-slate-900">
                {role.name}
                {role.is_active ? "" : " (inaktiv)"}
              </option>
            ))}
          </select>
          {formErrors?.primary_role_id ? (
            <p className="text-xs text-red-200">{formErrors.primary_role_id}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Weitere Rollen
          </span>
          <select
            multiple
            value={uniqueRoleIds(values.additional_role_ids).filter(
              (roleId) => roleId !== values.primary_role_id,
            )}
            onChange={handleAdditionalRoles}
            className="h-24 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
          >
            {availableAdditionalOptions.map((role) => (
              <option key={role.id} value={role.id} className="bg-slate-900">
                {role.name}
                {role.is_active ? "" : " (inaktiv)"}
              </option>
            ))}
          </select>
          {formErrors?.additional_role_ids ? (
            <p className="text-xs text-red-200">
              {formErrors.additional_role_ids}
            </p>
          ) : null}
        </label>
      </div>

      {message ? (
        <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/75">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {loading
          ? "Speichern..."
          : mode === "create"
            ? "Benutzer anlegen"
            : "Benutzer speichern"}
      </button>
    </form>
  );
}
