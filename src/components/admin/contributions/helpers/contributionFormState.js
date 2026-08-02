import { getContributionDefaultTitle } from "./contributionTitleDefaults.js";

export function buildInitialContributionForm(contribution, currentSeasonId) {
  const contributionKey = contribution?.contributionKey || "regular";

  return {
    playerId: contribution?.playerId || "",
    seasonId: contribution?.seasonId || currentSeasonId || "",
    contributionKey,
    title: contribution?.title || getContributionDefaultTitle(contributionKey),
    amountDue: contribution?.amountDue || "",
    dueDate: contribution?.dueDate || "",
    teamSnapshotName: contribution?.teamSnapshotName || "",
    installmentAgreement: Boolean(contribution?.installmentAgreement),
    installmentNotes: contribution?.installmentNotes || "",
    internalNotes: contribution?.internalNotes || "",
  };
}

export function buildContributionPayload(form, contributionId = null) {
  return {
    contributionId,
    playerId: form.playerId,
    seasonId: form.seasonId,
    contributionKey: form.contributionKey,
    title: form.title,
    amountDue: form.amountDue,
    dueDate: form.dueDate,
    teamSnapshotName: form.teamSnapshotName,
    installmentAgreement: form.installmentAgreement,
    installmentNotes: form.installmentNotes,
    internalNotes: form.internalNotes,
  };
}
