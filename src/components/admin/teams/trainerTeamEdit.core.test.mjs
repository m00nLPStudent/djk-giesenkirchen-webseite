import assert from "node:assert/strict";
import test from "node:test";
import {
  canRestrictedTrainerEditTab,
  isRestrictedTrainerRoleSet,
  pickTrainerTeamMutationPayload,
} from "./trainerTeamEdit.core.mjs";

test("a trainer without an elevated role uses the restricted contract", () => {
  assert.equal(isRestrictedTrainerRoleSet([{ key: "trainer", is_active: true }]), true);
  assert.equal(isRestrictedTrainerRoleSet([{ key: "trainer" }, { key: "fussball-vorstand" }]), false);
  assert.equal(isRestrictedTrainerRoleSet([{ key: "trainer" }, { key: "webmaster" }]), false);
  assert.equal(isRestrictedTrainerRoleSet([{ key: "superadmin" }]), false);
});

test("only description, training, roster and contact tabs are editable", () => {
  for (const tab of ["description", "training", "players", "contact"]) {
    assert.equal(canRestrictedTrainerEditTab(tab), true);
  }
  for (const tab of ["season", "base", "staff", "competition", "media", "settings"]) {
    assert.equal(canRestrictedTrainerEditTab(tab), false);
  }
});

test("targeted payloads ignore injected fields", () => {
  assert.deepEqual(pickTrainerTeamMutationPayload("description", {
    description_de: " Eigene Mannschaft ", is_active: false, season_id: "foreign",
  }), { description_de: "Eigene Mannschaft" });
  assert.deepEqual(pickTrainerTeamMutationPayload("contact", {
    contact_name: " Kontakt ", contact_email: "test-address", contact_phone: "+49 123",
    fussball_de_table_widget_id: "injected",
  }), { contact_name: "Kontakt", contact_email: "test-address", contact_phone: "49123" });
  assert.equal(pickTrainerTeamMutationPayload("settings", { is_active: false }), null);
});
