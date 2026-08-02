import test from "node:test";
import assert from "node:assert/strict";

import {
  getContributionDefaultTitle,
  isContributionTitleCustomized,
  resolveContributionTitleChange,
} from "./contributionTitleDefaults.js";

test("regular maps to Jahresbeitrag", () => {
  assert.equal(getContributionDefaultTitle("regular"), "Jahresbeitrag");
});

test("type change updates untouched default title in create mode", () => {
  const result = resolveContributionTitleChange({
    currentTitle: "Jahresbeitrag",
    previousContributionKey: "regular",
    nextContributionKey: "special_fee",
    hasManualTitle: false,
    isEdit: false,
  });

  assert.equal(result.nextTitle, "Sonderbeitrag");
  assert.equal(result.hasManualTitle, false);
});

test("customized title stays unchanged on type change", () => {
  const result = resolveContributionTitleChange({
    currentTitle: "Trainingslager 2026",
    previousContributionKey: "regular",
    nextContributionKey: "special_fee",
    hasManualTitle: true,
    isEdit: false,
  });

  assert.equal(result.nextTitle, "Trainingslager 2026");
  assert.equal(result.hasManualTitle, true);
});

test("edit mode does not overwrite existing title", () => {
  const result = resolveContributionTitleChange({
    currentTitle: "Historischer Titel",
    previousContributionKey: "regular",
    nextContributionKey: "admission_fee",
    hasManualTitle: true,
    isEdit: true,
  });

  assert.equal(result.nextTitle, "Historischer Titel");
});

test("manual title detection ignores the matching default label", () => {
  assert.equal(isContributionTitleCustomized("Jahresbeitrag", "regular"), false);
  assert.equal(isContributionTitleCustomized("Eigenbeitrag", "regular"), true);
});

