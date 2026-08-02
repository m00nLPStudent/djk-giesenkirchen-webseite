"use client";

import { useState } from "react";
import { FormActions, FormAlert, TextareaField } from "@/components/admin/forms";
import { cancelContributionAction } from "@/app/admin/contributions/actions";
import ContributionDialogShell from "./ContributionDialogShell";

export default function CancelContributionDialog({
  contribution,
  open,
  onClose,
  onSuccess,
}) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const result = await cancelContributionAction({
      contributionId: contribution.id,
      cancellationReason,
    });
    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(result?.message || "Der Beitrag konnte nicht storniert werden.");
      return;
    }

    onSuccess("canceled");
  }

  return (
    <ContributionDialogShell
      open={open}
      onClose={onClose}
      title="Beitrag stornieren"
      subtitle="Gebuchte Zahlungen muessen zuerst storniert werden. Der Beitrag bleibt als Verlaufseintrag erhalten."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormAlert tone="warning">
          Bitte nur mit nachvollziehbarem Fachgrund stornieren. Ein Loeschen der Historie ist nicht vorgesehen.
        </FormAlert>
        {message && <FormAlert>{message}</FormAlert>}
        <TextareaField
          label="Stornierungsgrund"
          required
          rows={4}
          value={cancellationReason}
          onChange={(event) => setCancellationReason(event.target.value)}
        />
        {errors.cancellationReason && (
          <p className="text-sm text-red-400">{errors.cancellationReason}</p>
        )}
        <FormActions
          loading={loading}
          submitLabel="Beitrag stornieren"
          loadingLabel="Storniert..."
        />
      </form>
    </ContributionDialogShell>
  );
}
