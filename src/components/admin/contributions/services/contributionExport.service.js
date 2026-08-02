import {
  escapeCsvValue,
  formatContributionAmount,
  formatContributionDate,
  getContributionKeyLabel,
  getContributionStatusLabel,
} from "../helpers/contributionFormatters.js";

export function buildContributionExportRows(contributions = []) {
  return (contributions || []).map((item) => ({
    player: item.playerDisplayName || "",
    season: item.seasonName || "",
    team: item.teamSnapshotName || "",
    contributionType: getContributionKeyLabel(item.contributionKey),
    title: item.title || "",
    amountDue: formatContributionAmount(item.amountDue),
    amountPaid: formatContributionAmount(item.amountPaid),
    amountWaived: formatContributionAmount(item.amountWaived),
    amountOutstanding: formatContributionAmount(item.amountOutstanding),
    status: getContributionStatusLabel(item.status),
    dueDate: formatContributionDate(item.dueDate),
    lastPaymentAt: formatContributionDate(item.lastPaymentAt),
  }));
}

export function buildContributionExportCsv(contributions = []) {
  const header = [
    "Spieler",
    "Saison",
    "Mannschaft",
    "Beitragstyp",
    "Titel",
    "Sollbetrag",
    "Gezahlt",
    "Erlassen",
    "Offen",
    "Status",
    "Faelligkeit",
    "Letzte Zahlung",
  ];
  const rows = buildContributionExportRows(contributions);
  const lines = [
    header.map((value) => escapeCsvValue(value)).join(","),
    ...rows.map((row) =>
      [
        row.player,
        row.season,
        row.team,
        row.contributionType,
        row.title,
        row.amountDue,
        row.amountPaid,
        row.amountWaived,
        row.amountOutstanding,
        row.status,
        row.dueDate,
        row.lastPaymentAt,
      ]
        .map((value) => escapeCsvValue(value))
        .join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}
