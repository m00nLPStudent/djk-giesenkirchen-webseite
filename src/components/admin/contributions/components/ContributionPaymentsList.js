import {
  formatContributionAmount,
  formatContributionDate,
  formatContributionDateTime,
  getContributionPaymentMethodLabel,
} from "../helpers/contributionFormatters.js";

function PaymentStatusBadge({ status }) {
  const isCanceled = status === "canceled";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
        isCanceled
          ? "border-white/10 bg-white/5 text-white/55"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      {isCanceled ? "Storniert" : "Gebucht"}
    </span>
  );
}

export default function ContributionPaymentsList({
  payments = [],
  onCancelPayment,
  canCancelPayment = false,
}) {
  if (!payments.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/55">
        Noch keine Zahlungen erfasst.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 xl:block">
        <div className="grid grid-cols-[minmax(7rem,0.9fr)_minmax(6.5rem,0.8fr)_minmax(8rem,1fr)_minmax(7rem,0.9fr)_minmax(7rem,0.8fr)_minmax(8.5rem,1fr)] gap-4 border-b border-white/10 px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/42">
          <span>Datum</span>
          <span>Betrag</span>
          <span>Zahlungsmethode</span>
          <span>Referenz</span>
          <span>Status</span>
          <span>Aktion</span>
        </div>
        {(payments || []).map((payment) => (
          <div
            key={`${payment.id}-desktop`}
            className="grid grid-cols-[minmax(7rem,0.9fr)_minmax(6.5rem,0.8fr)_minmax(8rem,1fr)_minmax(7rem,0.9fr)_minmax(7rem,0.8fr)_minmax(8.5rem,1fr)] items-center gap-4 border-t border-white/10 px-4 py-3 text-sm"
          >
            <span className="text-white/70">{formatContributionDate(payment.paidAt)}</span>
            <span className="font-bold text-white">
              {formatContributionAmount(payment.amount)}
            </span>
            <span className="min-w-0 truncate text-white">
              {getContributionPaymentMethodLabel(payment.paymentMethod)}
            </span>
            <span className="min-w-0 truncate text-white/62" title={payment.reference || "-"}>
              {payment.reference || "-"}
            </span>
            <div className="min-w-0">
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div className="flex justify-end">
              {canCancelPayment && payment.status === "booked" ? (
                <button
                  type="button"
                  onClick={() => onCancelPayment(payment)}
                  className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
                >
                  Storno
                </button>
              ) : payment.status === "canceled" ? (
                <span className="text-xs font-medium text-white/40">Bereits storniert</span>
              ) : (
                <span className="text-xs text-white/35">-</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {(payments || []).map((payment) => (
        <div
          key={payment.id}
          className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 xl:hidden"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-black text-white">
                  {formatContributionAmount(payment.amount)}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  Zahlung vom {formatContributionDate(payment.paidAt)}
                </p>
              </div>

              <PaymentStatusBadge status={payment.status} />
            </div>

            <dl className="grid gap-2 text-sm">
              <MobileRow label="Zahlungsdatum" value={formatContributionDateTime(payment.paidAt)} />
              <MobileRow
                label="Zahlungsmethode"
                value={getContributionPaymentMethodLabel(payment.paymentMethod)}
              />
              <MobileRow label="Referenz" value={payment.reference || "-"} />
              <MobileRow label="Erfasst am" value={formatContributionDateTime(payment.createdAt)} />
              <MobileRow label="Storniert am" value={formatContributionDateTime(payment.canceledAt)} />
              <MobileRow label="Stornierungsgrund" value={payment.cancellationReason || "-"} />
            </dl>

            {canCancelPayment && payment.status === "booked" && (
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => onCancelPayment(payment)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
                >
                  Storno
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-white/10 bg-[#111218] px-3 py-2.5">
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/42">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-white break-words">{value || "-"}</dd>
    </div>
  );
}
