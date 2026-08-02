"use client";

import { useState } from "react";
import { FormActions, FormAlert, TextareaField } from "@/components/admin/forms";
import { exemptContributionAction } from "@/app/admin/contributions/actions";
import ContributionDialogShell from "./ContributionDialogShell";

export default function ExemptContributionDialog({
  contribution,
  open,
  onClose,
  onSuccess,
}) {
  const [exemptionReason, setExemptionReason] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const result = await exemptContributionAction({
      contributionId: contribution.id,
      exemptionReason,
    });
    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(result?.message || "Die Befreiung konnte nicht gespeichert werden.");
      return;
    }

    onSuccess("exempted");
  }

  return (
    <ContributionDialogShell
      open={open}
      onClose={onClose}
      title="Beitrag befreien"
      subtitle="Es wird nur eine vollstaendige Befreiung angeboten. Bereits bestehende Zahlungen blockieren die Aktion serverseitig."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormAlert tone="warning">
          Eine Aufhebung der Befreiung wird in diesem Ausbaustand bewusst nicht angeboten.
        </FormAlert>
        {message && <FormAlert>{message}</FormAlert>}
        <TextareaField
          label="Befreiungsgrund"
          required
          rows={4}
          value={exemptionReason}
          onChange={(event) => setExemptionReason(event.target.value)}
        />
        {errors.exemptionReason && (
          <p className="text-sm text-red-400">{errors.exemptionReason}</p>
        )}
        <FormActions
          loading={loading}
          submitLabel="Beitrag befreien"
          loadingLabel="Befreit..."
        />
      </form>
    </ContributionDialogShell>
  );
}
