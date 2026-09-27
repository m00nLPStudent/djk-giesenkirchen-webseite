import assert from "node:assert/strict";
import test from "node:test";
import {
  canRestrictedTrainerEditTab,
  isRestrictedTrainerRoleSet,
  pickTrainerTeamMutationPayload,
  synchronizeTrainerTeamFormAfterSave,
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

test("successful trainer saves synchronize normalized text and roster state", () => {
  const original = {
    description_de: "Hallo Test",
    training_times_de: "Alt",
    contact_name: "Alt",
    contact_email: "alt@example.test",
    contact_phone: "123",
    selected_player_ids: ["player-old"],
  };

  assert.equal(
    synchronizeTrainerTeamFormAfterSave(original, "description", {
      description_de: "Hallo",
    }).description_de,
    "Hallo",
  );
  assert.equal(
    synchronizeTrainerTeamFormAfterSave(original, "description", {
      description_de: "Hallo Welt",
    }).description_de,
    "Hallo Welt",
  );
  assert.equal(
    synchronizeTrainerTeamFormAfterSave(original, "description", {
      description_de: null,
    }).description_de,
    "",
  );

  const training = synchronizeTrainerTeamFormAfterSave(original, "training", {
    training_times_de: "Dienstag 18 Uhr",
  });
  assert.equal(training.training_times_de, "Dienstag 18 Uhr");

  const contact = synchronizeTrainerTeamFormAfterSave(original, "contact", {
    contact_name: "Kontakt",
    contact_email: "kontakt@example.test",
    contact_phone: "49123",
  });
  assert.deepEqual(
    [contact.contact_name, contact.contact_email, contact.contact_phone],
    ["Kontakt", "kontakt@example.test", "49123"],
  );

  const roster = synchronizeTrainerTeamFormAfterSave(original, "players", {
    selected_player_ids: ["player-new"],
  });
  assert.deepEqual(roster.selected_player_ids, ["player-new"]);
});
