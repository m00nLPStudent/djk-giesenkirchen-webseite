import AdminPanel from "@/components/admin/common/AdminPanel";
import {
  formatContributionAmount,
  formatContributionDate,
} from "../helpers/contributionFormatters.js";

function ActionButton({ children, tone = "default", ...props }) {
  const toneClassName =
    tone === "danger"
      ? "border-red-500/35 text-red-100 hover:bg-red-500/10"
      : tone === "primary"
        ? "border-red-500/35 bg-red-600 text-white hover:bg-red-700"
        : "border-white/10 text-white/80 hover:border-red-500 hover:text-white";

  return (
    <button
      type="button"
      className={`w-full rounded-full border px-4 py-3 text-sm font-bold transition sm:w-auto ${toneClassName}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ActionSection({
  title,
  tone = "default",
  copy,
  detailRows = [],
  action = null,
}) {
  const titleClassName =
    tone === "danger" ? "text-red-200" : "text-white/55";

  return (
    <section className="space-y-4">
      <h4 className={`text-xs font-black uppercase tracking-[0.22em] ${titleClassName}`}>
        {title}
      </h4>
      {copy ? <p className="text-sm leading-6 text-white/65">{copy}</p> : null}
      {detailRows.length ? (
        <dl className="space-y-3">
          {detailRows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 sm:grid-cols-[minmax(7rem,0.9fr)_minmax(0,1.1fr)] sm:gap-3"
            >
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/42">
                {label}
              </dt>
              <dd className="text-sm font-medium leading-6 text-white break-words">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {action}
    </section>
  );
}

export default function ContributionDetailActions({
  contribution,
  uiState,
  onOpenDialog,
}) {
  const isCanceled = contribution.status === "canceled";
  const showDeferred = Boolean(
    uiState.canDefer ||
      uiState.canResume ||
      contribution.deferredUntil ||
      contribution.deferredReason,
  );
  const showExempt = Boolean(
    uiState.canExempt ||
      contribution.status === "exempt" ||
      contribution.exemptedAt ||
      contribution.exemptionReason,
  );
  const showDanger = Boolean(uiState.canCancel);
  const visibleSections = [showDeferred, showExempt, showDanger].filter(Boolean).length;
  const hasStatusDetails = Boolean(
    contribution.deferredUntil ||
      contribution.deferredReason ||
      contribution.exemptedAt ||
      contribution.exemptionReason ||
      contribution.canceledAt ||
      contribution.cancellationReason ||
      isCanceled,
  );
  const hasMutations = uiState.canDefer || uiState.canResume || uiState.canExempt || uiState.canCancel;

  if (!hasStatusDetails && !hasMutations) {
    return null;
  }

  if (isCanceled) {
    return (
      <AdminPanel className="p-5 md:p-6">
        <h3 className="text-xl font-black text-white">Aktionen und Status</h3>
        <div className="mt-5 rounded-[1.35rem] border border-red-500/20 bg-red-500/5 p-5">
          <ActionSection
            title="Gefahrenbereich"
            tone="danger"
            copy="Dieser Beitrag wurde storniert und kann nicht weiter bearbeitet werden."
            detailRows={[
              ["Status", "Storniert"],
              ["Storniert am", formatContributionDate(contribution.canceledAt)],
              ["Grund", contribution.cancellationReason || "-"],
            ]}
          />
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel className="p-5 md:p-6">
      <h3 className="text-xl font-black text-white">Aktionen und Status</h3>
      <p className="mt-2 text-sm text-white/60">
        Stundung, Befreiung und gefaehrliche Aenderungen bleiben direkt an diesem Beitrag.
      </p>

      <div
        className={`mt-5 grid gap-5 rounded-[1.35rem] border border-white/10 bg-black/20 p-5 xl:gap-0 xl:divide-x xl:divide-white/10 xl:p-0 ${
          visibleSections >= 3
            ? "xl:grid-cols-3"
            : visibleSections === 2
              ? "xl:grid-cols-2"
              : "xl:grid-cols-1"
        }`}
      >
        {showDeferred ? (
          <div className="xl:p-5">
            <ActionSection
              title="Stundung"
              copy={
                uiState.canResume || contribution.deferredUntil || contribution.deferredReason
                  ? "Der Beitrag ist aktuell gestundet."
                  : "Keine Stundung aktiv."
              }
              detailRows={
                uiState.canResume || contribution.deferredUntil || contribution.deferredReason
                  ? [
                      ["Gestundet bis", formatContributionDate(contribution.deferredUntil)],
                      ["Grund", contribution.deferredReason || "-"],
                    ]
                  : []
              }
              action={
                uiState.canResume ? (
                  <ActionButton onClick={() => onOpenDialog("resume")}>
                    Stundung aufheben
                  </ActionButton>
                ) : uiState.canDefer ? (
                  <ActionButton onClick={() => onOpenDialog("defer")}>
                    Beitrag stunden
                  </ActionButton>
                ) : null
              }
            />
          </div>
        ) : null}

        {showExempt ? (
          <div className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0 xl:border-t-0 xl:p-5">
            <ActionSection
              title="Befreiung"
              copy={
                contribution.status === "exempt" || contribution.exemptedAt || contribution.exemptionReason
                  ? "Der Beitrag wurde ganz oder teilweise befreit."
                  : "Keine Befreiung aktiv."
              }
              detailRows={
                contribution.status === "exempt" || contribution.exemptedAt || contribution.exemptionReason
                  ? [
                      ["Befreiungsgrund", contribution.exemptionReason || "-"],
                      ["Befreiungsdatum", formatContributionDate(contribution.exemptedAt)],
                      ["Erlassener Betrag", formatContributionAmount(contribution.amountWaived)],
                    ]
                  : []
              }
              action={
                uiState.canExempt ? (
                  <ActionButton onClick={() => onOpenDialog("exempt")}>
                    Beitrag befreien
                  </ActionButton>
                ) : null
              }
            />
          </div>
        ) : null}

        {showDanger ? (
          <div className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0 xl:border-t-0 xl:p-5">
            <ActionSection
              title="Gefahrenbereich"
              tone="danger"
              copy="Eine Stornierung beendet die weitere Bearbeitung dieses Beitrags dauerhaft."
              detailRows={[]}
              action={
                uiState.canCancel ? (
                  <ActionButton tone="danger" onClick={() => onOpenDialog("cancel")}>
                    Beitrag stornieren
                  </ActionButton>
                ) : null
              }
            />
          </div>
        ) : null}
      </div>
    </AdminPanel>
  );
}
