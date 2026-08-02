import {
  formatContributionAmount,
  formatContributionDate,
  formatContributionDateTime,
  getContributionKeyLabel,
} from "./contributionFormatters.js";

function toText(value = "") {
  const normalized = String(value || "").trim();
  return normalized || "-";
}

export function getContributionDetailMeta(contribution = {}) {
  return [
    String(contribution.title || "").trim(),
    contribution.seasonName || "",
    contribution.teamSnapshotName || "",
  ].filter(Boolean).join(" \u00B7 ");
}

export function getContributionDetailInfoItems(
  contribution = {},
  { canSeeInternalNotes = false } = {},
) {
  const items = [
    ["Beitragstyp", getContributionKeyLabel(contribution.contributionKey)],
    ["Titel", toText(contribution.title)],
    ["Saison", toText(contribution.seasonName)],
    ["Mannschaft", toText(contribution.teamSnapshotName)],
    ["Faelligkeit", formatContributionDate(contribution.dueDate)],
    ["Ratenzahlung", contribution.installmentAgreement ? "Ja" : "Nein"],
    ["Ratenzahlungsnotiz", toText(contribution.installmentNotes)],
  ];

  if (canSeeInternalNotes) {
    items.push(["Interne Notiz", toText(contribution.internalNotes)]);
  }

  items.push(["Erstellt am", formatContributionDateTime(contribution.createdAt)]);
  items.push(["Geaendert am", formatContributionDateTime(contribution.updatedAt)]);

  return items;
}

export function getContributionSpecialStatusSections(contribution = {}) {
  const sections = [];

  if (
    contribution.status === "deferred" ||
    contribution.deferredUntil ||
    contribution.deferredReason
  ) {
    sections.push({
      key: "deferred",
      title: "Stundung",
      items: [
        ["Gestundet bis", formatContributionDate(contribution.deferredUntil)],
        ["Stundungsgrund", toText(contribution.deferredReason)],
      ],
    });
  }

  if (
    contribution.status === "exempt" ||
    contribution.exemptionReason ||
    contribution.exemptedAt
  ) {
    sections.push({
      key: "exempt",
      title: "Befreiung",
      items: [
        ["Status", "Befreit"],
        ["Befreiungsgrund", toText(contribution.exemptionReason)],
        ["Befreiungsdatum", formatContributionDate(contribution.exemptedAt)],
        ["Erlassener Betrag", formatContributionAmount(contribution.amountWaived)],
      ],
    });
  }

  if (
    contribution.status === "canceled" ||
    contribution.cancellationReason ||
    contribution.canceledAt
  ) {
    sections.push({
      key: "canceled",
      title: "Storno",
      items: [
        ["Status", "Storniert"],
        ["Stornierungsgrund", toText(contribution.cancellationReason)],
        ["Storniert am", formatContributionDate(contribution.canceledAt)],
        ["Hinweis", "Dieser Beitrag kann nicht weiter bearbeitet werden."],
      ],
    });
  }

  return sections;
}
