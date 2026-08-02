"use client";

import { useState } from "react";
import { FormAlert, FormActions } from "@/components/admin/forms";
import { recordContributionPaymentAction } from "@/app/admin/contributions/actions";
import { formatContributionAmount } from "../helpers/contributionFormatters.js";
import ContributionDialogShell from "./ContributionDialogShell";
import PaymentForm from "../forms/PaymentForm";

function buildInitialForm(contribution = {}) {
  return {
    amount: contribution.amountOutstanding || "",
    paidAt: new Date().toISOString().slice(0, 10),
    paymentMethod: "",
    reference: "",
    internalNotes: "",
  };
}

export default function RecordPaymentDialog({
  contribution,
  open,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(buildInitialForm(contribution));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const result = await recordContributionPaymentAction({
      contributionId: contribution.id,
      ...form,
    });
    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(result?.message || "Die Zahlung konnte nicht gespeichert werden.");
      return;
    }

    onSuccess("payment_recorded");
  }

  return (
    <ContributionDialogShell
      open={open}
      onClose={onClose}
      title="Zahlung erfassen"
      subtitle={`Restbetrag aktuell: ${formatContributionAmount(contribution.amountOutstanding)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormAlert tone="warning">
          Ueberzahlungen werden im Browser freundlich abgefangen, die serverseitige Pruefung bleibt aber massgeblich.
        </FormAlert>
        {message && <FormAlert>{message}</FormAlert>}
        <PaymentForm
          form={form}
          errors={errors}
          onChange={updateField}
          maxAmount={formatContributionAmount(contribution.amountOutstanding)}
        />
        <FormActions
          loading={loading}
          submitLabel="Zahlung buchen"
          loadingLabel="Bucht..."
        />
      </form>
    </ContributionDialogShell>
  );
}
