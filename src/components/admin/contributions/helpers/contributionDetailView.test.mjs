import test from "node:test";
import assert from "node:assert/strict";

import {
  getContributionDetailInfoItems,
  getContributionDetailMeta,
  getContributionSpecialStatusSections,
} from "./contributionDetailView.js";

test("detail meta keeps title, season and team in a compact header line", () => {
  assert.equal(
    getContributionDetailMeta({
      title: "Jahresbeitrag",
      seasonName: "2026/2027",
      teamSnapshotName: "E1",
    }),
    "Jahresbeitrag \u00B7 2026/2027 \u00B7 E1",
  );
});

test("detail info keeps the relevant working fields", () => {
  const items = getContributionDetailInfoItems(
    {
      contributionKey: "regular",
      title: "Jahresbeitrag",
      seasonName: "2026/2027",
      teamSnapshotName: "E1",
      dueDate: "2026-10-01",
      installmentAgreement: true,
      installmentNotes: "Monatlich",
      internalNotes: "Hinweis",
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    },
    { canSeeInternalNotes: true },
  );

  assert.deepEqual(
    items.map(([label]) => label),
    [
      "Beitragstyp",
      "Titel",
      "Saison",
      "Mannschaft",
      "Faelligkeit",
      "Ratenzahlung",
      "Ratenzahlungsnotiz",
      "Interne Notiz",
      "Erstellt am",
      "Geaendert am",
    ],
  );
});

test("special status sections only appear when relevant", () => {
  assert.equal(getContributionSpecialStatusSections({ status: "open" }).length, 0);

  const sections = getContributionSpecialStatusSections({
    status: "canceled",
    canceledAt: "2026-05-01",
    cancellationReason: "Doppelanlage",
    exemptionReason: "Sozialfall",
    exemptedAt: "2026-04-01",
    deferredUntil: "2026-03-01",
    deferredReason: "Abgesprochen",
  });

  assert.deepEqual(
    sections.map((section) => section.title),
    ["Stundung", "Befreiung", "Storno"],
  );
  assert.deepEqual(sections[1].items[3], ["Erlassener Betrag", "0,00\u00A0\u20AC"]);
  assert.deepEqual(sections[2].items[3], [
    "Hinweis",
    "Dieser Beitrag kann nicht weiter bearbeitet werden.",
  ]);
});
