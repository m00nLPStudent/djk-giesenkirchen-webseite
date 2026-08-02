"use client";

import { useState } from "react";
import {
  FormActions,
  FormAlert,
  InputField,
  TextareaField,
} from "@/components/admin/forms";
import {
  deferContributionAction,
  resumeContributionAction,
} from "@/app/admin/contributions/actions";
import { formatContributionDate } from "../helpers/contributionFormatters.js";
import ContributionDialogShell from "./ContributionDialogShell";

export default function DeferContributionDialog({
  contribution,
  mode = "defer",
  open,
  onClose,
  onSuccess,
}) {
  const [deferredUntil, setDeferredUntil] = useState(
    contribution?.deferredUntil || "",
  );
  const [deferredReason, setDeferredReason] = useState(
    contribution?.deferredReason || "",
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isResume = mode === "resume";

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const action = isResume
      ? resumeContributionAction
      : deferContributionAction;
    const result = await action({
      contributionId: contribution.id,
      deferredUntil,
      deferredReason,
    });
    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(result?.message || "Die Aktion konnte nicht gespeichert werden.");
      return;
    }

    onSuccess(isResume ? "resumed" : "deferred");
  }

  return (
    <ContributionDialogShell
      open={open}
      onClose={onClose}
      title={isResume ? "Stundung aufheben" : "Beitrag stunden"}
      subtitle={
        isResume
          ? `Aktuell gestundet bis ${formatContributionDate(contribution.deferredUntil)}.`
          : "Die Stundung setzt den Fachstatus serverseitig auf gestundet."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <FormAlert>{message}</FormAlert>}
        {!isResume && (
          <>
            <InputField
              label="Stundung bis"
              required
              type="date"
              value={deferredUntil}
              onChange={(event) => setDeferredUntil(event.target.value)}
              error={errors.deferredUntil}
            />
            <TextareaField
              label="Begruendung"
              required
              rows={4}
              value={deferredReason}
              onChange={(event) => setDeferredReason(event.target.value)}
            />
            {errors.deferredReason && (
              <p className="text-sm text-red-400">{errors.deferredReason}</p>
            )}
          </>
        )}
        {isResume && (
          <FormAlert tone="warning">
            Beim Aufheben wird keine freie Statuswahl angeboten. Der naechste Fachstatus wird serverseitig aus den Summen abgeleitet.
          </FormAlert>
        )}
        <FormActions
          loading={loading}
          submitLabel={isResume ? "Stundung aufheben" : "Stundung speichern"}
          loadingLabel={isResume ? "Hebt auf..." : "Speichert..."}
        />
      </form>
    </ContributionDialogShell>
  );
}
