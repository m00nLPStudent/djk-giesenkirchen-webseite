"use client";

import { useEffect, useMemo, useState } from "react";
import UserEditorForm from "../forms/UserEditorForm";
import { previewProfileCardEmailMatchesAction } from "@/app/admin/users/actions";

function mapInitialValues(user, includeCardLinks) {
  const base = {
    id: user?.id || null,
    full_name: user?.name || "",
    email: user?.email || "",
    is_active: user?.is_active !== false,
    primary_role_id: user?.primaryRole?.id || "",
    additional_role_ids: (user?.roles || [])
      .filter((role) => !role.is_primary)
      .map((role) => role.id),
  };

  if (!includeCardLinks) {
    return base;
  }

  return {
    ...base,
    linked_board_member_id: user?.linkedBoardMember?.id || null,
    linked_coach_id: user?.linkedCoach?.id || null,
  };
}

export default function UserEditorDialog({
  open,
  mode,
  user,
  roles,
  boardMembers,
  coaches,
  currentUserId,
  currentUserIsSuperAdmin,
  createCapabilities,
  onSubmit,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [matchPreview, setMatchPreview] = useState(null);
  const canManageCardLinks =
    mode === "edit" && Boolean(currentUserIsSuperAdmin);
  const initialValues = useMemo(
    () => mapInitialValues(user, canManageCardLinks),
    [user, canManageCardLinks],
  );
  const isCreateFlowEnabled = Boolean(createCapabilities?.createFlowEnabled);
  const missingConfig = createCapabilities?.missingConfig || [];
  const isMissingServiceRole = missingConfig.includes(
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const selfSuperadminRoleId = useMemo(() => {
    if (!user?.id || user.id !== currentUserId) return null;
    return (
      (user.roles || []).find((role) => role?.key === "superadmin")?.id || null
    );
  }, [user, currentUserId]);

  async function handleLoadPreview() {
    if (!canManageCardLinks || !user?.id) {
      setMatchPreview(null);
      return;
    }

    const result = await previewProfileCardEmailMatchesAction({
      adminProfileId: user.id,
    });

    if (!result?.ok) {
      setMatchPreview(null);
      return;
    }

    setMatchPreview(result);
  }

  async function handleSubmit(values) {
    setMessage("");
    setFormErrors({});
    setLoading(true);

    const result = await onSubmit(values);
    setLoading(false);

    if (!result?.ok) {
      setMessage(result?.message || "Speichern fehlgeschlagen.");
      setFormErrors(result?.errors || {});
      return;
    }

    setMessage(result?.message || "Gespeichert.");
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    handleLoadPreview();
  }, [open, canManageCardLinks, user?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <div className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-5 md:max-h-[85vh] md:overflow-y-auto md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-red-300">
              Benutzerverwaltung
            </p>
            <h3 className="mt-1 text-2xl font-black text-white">
              {mode === "create" ? "Neuer Benutzer" : "Benutzer bearbeiten"}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Primaere Rolle ist verpflichtend, weitere Rollen sind optional.
            </p>
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

        {mode === "create" && !isCreateFlowEnabled ? (
          <div className="mt-4 rounded-xl border border-amber-300/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {isMissingServiceRole
              ? "Benutzeranlage ist noch nicht aktiviert. SUPABASE_SERVICE_ROLE_KEY fehlt."
              : "Benutzeranlage ist vorbereitet. Bitte fehlende Supabase-Konfiguration ergaenzen."}
          </div>
        ) : null}

        {mode === "create" && !isCreateFlowEnabled ? null : (
          <div className="mt-5">
            <UserEditorForm
              mode={mode}
              roles={roles || []}
              boardMembers={boardMembers || []}
              coaches={coaches || []}
              initialValues={initialValues}
              loading={loading}
              currentUserId={currentUserId}
              canManageCardLinks={canManageCardLinks}
              selfSuperadminRoleId={selfSuperadminRoleId}
              matchPreview={matchPreview}
              onSubmit={handleSubmit}
              message={message}
              formErrors={formErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
