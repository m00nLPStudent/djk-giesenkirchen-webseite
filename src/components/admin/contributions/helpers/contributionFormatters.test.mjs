import test from "node:test";
import assert from "node:assert/strict";

import {
  getContributionPaymentMethodLabel,
  getContributionStatusLabel,
} from "./contributionFormatters.js";

test("compact status labels shorten partially paid only in overview contexts", () => {
  assert.equal(
    getContributionStatusLabel("partially_paid"),
    "Teilweise bezahlt",
  );
  assert.equal(
    getContributionStatusLabel("partially_paid", { compact: true }),
    "Teilbezahlt",
  );
  assert.equal(
    getContributionStatusLabel("paid", { compact: true }),
    "Bezahlt",
  );
});

test("payment method labels are shown in a user friendly way", () => {
  assert.equal(getContributionPaymentMethodLabel("transfer"), "Ueberweisung");
  assert.equal(getContributionPaymentMethodLabel("cash"), "Barzahlung");
  assert.equal(getContributionPaymentMethodLabel("card"), "Karte");
  assert.equal(getContributionPaymentMethodLabel("direct_debit"), "Lastschrift");
  assert.equal(getContributionPaymentMethodLabel("manual"), "manual");
  assert.equal(getContributionPaymentMethodLabel(""), "Keine Zahlungsart");
});
