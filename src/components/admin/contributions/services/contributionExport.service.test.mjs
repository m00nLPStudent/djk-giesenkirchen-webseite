import test from "node:test";
import assert from "node:assert/strict";

import {
  buildContributionExportCsv,
  buildContributionExportRows,
} from "./contributionExport.service.js";

test("buildContributionExportRows creates human-readable export rows without internal fields", () => {
  const rows = buildContributionExportRows([
    {
      playerDisplayName: "Anna Becker",
      seasonName: "2026/27",
      teamSnapshotName: "U19",
      contributionKey: "regular",
      title: "Mitgliedsbeitrag",
      amountDue: "120.00",
      amountPaid: "20.00",
      amountWaived: "0.00",
      amountOutstanding: "100.00",
      status: "open",
      dueDate: "2026-01-10",
      lastPaymentAt: "2026-01-02",
      internalNotes: "geheim",
    },
  ]);

  assert.deepEqual(Object.keys(rows[0]), [
    "player",
    "season",
    "team",
    "contributionType",
    "title",
    "amountDue",
    "amountPaid",
    "amountWaived",
    "amountOutstanding",
    "status",
    "dueDate",
    "lastPaymentAt",
  ]);
  assert.equal(rows[0].contributionType, "Jahresbeitrag");
  assert.equal(rows[0].status, "Offen");
});

test("buildContributionExportCsv neutralizes spreadsheet injection", () => {
  const csv = buildContributionExportCsv([
    {
      playerDisplayName: "=cmd|' /C calc'!A0",
      seasonName: "2026/27",
      teamSnapshotName: "U19",
      contributionKey: "special_fee",
      title: "@risk",
      amountDue: "10.00",
      amountPaid: "0.00",
      amountWaived: "0.00",
      amountOutstanding: "10.00",
      status: "open",
      dueDate: "2026-01-10",
      lastPaymentAt: null,
    },
  ]);

  assert.match(csv, /"'=cmd\|'/);
  assert.match(csv, /"'@risk"/);
});
