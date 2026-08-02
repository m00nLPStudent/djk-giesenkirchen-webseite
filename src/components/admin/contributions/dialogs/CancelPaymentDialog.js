"use client";

import { useState } from "react";
import { FormAlert, FormActions, TextareaField } from "@/components/admin/forms";
import { cancelContributionPaymentAction } from "@/app/admin/contributions/actions";
import {
  formatContributionAmount,
  formatContributionDateTime,
} from "../helpers/contributionFormatters.js";
import ContributionDialogShell from "./ContributionDialogShell";

export default function CancelPaymentDialog({
  payment,
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
    if (loading || !payment?.id) return;

    setLoading(true);
    const result = await cancelContributionPaymentAction({
      paymentId: payment.id,
      cancellationReason,
    });
    setLoading(false);

    if (!result?.ok) {
      setErrors(result?.fieldErrors || {});
      setMessage(result?.message || "Die Zahlung konnte nicht storniert werden.");
      return;
    }

    onSuccess("payment_canceled");
  }

  return (
    <ContributionDialogShell
      open={open}
      onClose={onClose}
      title="Zahlung stornieren"
      subtitle="Die Zahlung bleibt in der Historie sichtbar und wird fachlich als storniert markiert."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormAlert tone="warning">
          Bitte nur bei fachlich begruendetem Fehler stornieren. Ein Hard Delete ist nicht vorgesehen.
        </FormAlert>
        {message && <FormAlert>{message}</FormAlert>}
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/65">
          <p className="font-bold text-white">
            {formatContributionAmount(payment?.amount)}
          </p>
          <p className="mt-2">
            Gebucht am {formatContributionDateTime(payment?.paidAt)} mit{" "}
            {payment?.paymentMethod || "unbekannter Zahlungsart"}.
          </p>
          <p className="mt-1">Referenz: {payment?.reference || "-"}</p>
        </div>
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
          submitLabel="Zahlung stornieren"
          loadingLabel="Storniert..."
        />
      </form>
    </ContributionDialogShell>
  );
}
