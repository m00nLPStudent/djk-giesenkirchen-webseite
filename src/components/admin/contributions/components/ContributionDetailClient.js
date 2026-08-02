"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/admin/forms";
import {
  getContributionNotice,
  getContributionUiState,
  normalizeContributionDialog,
} from "../helpers/contributionUiState.js";
import ContributionDetailActions from "./ContributionDetailActions";
import ContributionDetailAmounts from "./ContributionDetailAmounts";
import ContributionDetailHeader from "./ContributionDetailHeader";
import ContributionDetailInfoPanel from "./ContributionDetailInfoPanel";
import ContributionPaymentsList from "./ContributionPaymentsList";
import CancelContributionDialog from "../dialogs/CancelContributionDialog";
import CancelPaymentDialog from "../dialogs/CancelPaymentDialog";
import DeferContributionDialog from "../dialogs/DeferContributionDialog";
import ExemptContributionDialog from "../dialogs/ExemptContributionDialog";
import RecordPaymentDialog from "../dialogs/RecordPaymentDialog";

function PrimaryActions({ contributionId, uiState, onOpenDialog }) {
  if (!uiState.canRecordPayment && !uiState.canEdit) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end">
      {uiState.canEdit ? (
        <Link
          href={`/admin/contributions/${contributionId}/edit`}
          className="rounded-full border border-white/10 px-4 py-2.5 text-center text-sm font-bold text-white/80 transition hover:border-red-500 hover:text-white"
        >
          Bearbeiten
        </Link>
      ) : null}
      {uiState.canRecordPayment ? (
        <button
          type="button"
          onClick={() => onOpenDialog("payment")}
          className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
        >
          Zahlung erfassen
        </button>
      ) : null}
    </div>
  );
}

function buildQuery(dialog = "", paymentId = "") {
  const next = new URLSearchParams();
  if (dialog) next.set("dialog", dialog);
  if (paymentId) next.set("paymentId", paymentId);
  return next.toString();
}

export default function ContributionDetailClient({
  contribution,
  permissionKeys = [],
  initialDialog = "",
  initialPaymentId = "",
  notice = "",
}) {
  const router = useRouter();
  const uiState = useMemo(
    () => getContributionUiState(contribution, permissionKeys),
    [contribution, permissionKeys],
  );
  const [dialog, setDialog] = useState(
    normalizeContributionDialog(initialDialog),
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState(initialPaymentId);
  const selectedPayment = useMemo(
    () =>
      (contribution.payments || []).find(
        (payment) => payment.id === selectedPaymentId,
      ) || null,
    [contribution.payments, selectedPaymentId],
  );
  const noticeMessage = getContributionNotice(notice);

  function openDialog(nextDialog, paymentId = "") {
    setDialog(nextDialog);
    setSelectedPaymentId(paymentId);
    const query = buildQuery(nextDialog, paymentId);
    startTransition(() => {
      router.replace(
        query
          ? `/admin/contributions/${contribution.id}?${query}`
          : `/admin/contributions/${contribution.id}`,
        { scroll: false },
      );
    });
  }

  function closeDialog() {
    openDialog("", "");
  }

  function handleSuccess(nextNotice) {
    setDialog("");
    setSelectedPaymentId("");
    startTransition(() => {
      router.replace(
        `/admin/contributions/${contribution.id}?notice=${nextNotice}`,
        { scroll: false },
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {noticeMessage && (
        <FormAlert
          tone="warning"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
        >
          {noticeMessage}
        </FormAlert>
      )}

      <ContributionDetailHeader
        contribution={contribution}
        actions={(
          <PrimaryActions
            contributionId={contribution.id}
            uiState={uiState}
            onOpenDialog={openDialog}
          />
        )}
      />
      <ContributionDetailAmounts contribution={contribution} />

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.5fr)]">
        <ContributionDetailInfoPanel
          contribution={contribution}
          canSeeInternalNotes={uiState.canSeeInternalNotes}
        />

        <div className="space-y-6 min-w-0">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <h2 className="text-xl font-black text-white">Zahlungshistorie</h2>
            <p className="mt-2 text-sm text-white/60">
              Zahlungen, Referenzen und moegliche Stornos bleiben direkt am Beitrag.
            </p>
            <div className="mt-5">
              <ContributionPaymentsList
                payments={contribution.payments || []}
                canCancelPayment={uiState.canCancelPayment}
                onCancelPayment={(payment) =>
                  openDialog("cancel-payment", payment.id)
                }
              />
            </div>
          </section>

          <ContributionDetailActions
            contribution={contribution}
            uiState={uiState}
            onOpenDialog={openDialog}
          />
        </div>
      </div>

      <RecordPaymentDialog
        contribution={contribution}
        open={dialog === "payment"}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
      <CancelPaymentDialog
        payment={selectedPayment}
        open={dialog === "cancel-payment" && Boolean(selectedPayment)}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
      <DeferContributionDialog
        contribution={contribution}
        mode={dialog === "resume" ? "resume" : "defer"}
        open={dialog === "defer" || dialog === "resume"}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
      <ExemptContributionDialog
        contribution={contribution}
        open={dialog === "exempt"}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
      <CancelContributionDialog
        contribution={contribution}
        open={dialog === "cancel"}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
