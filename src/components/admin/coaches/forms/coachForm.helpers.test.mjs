import test from "node:test";
import assert from "node:assert/strict";
import {
  createCoachAssignmentDraft,
  createCoachSubmissionPayload,
  createInitialCoachFormState,
  validateCoachFormState,
} from "./coachForm.core.mjs";

test("createInitialCoachFormState keeps assignment roles and does not copy master roles into them", () => {
  const form = createInitialCoachFormState(
    {
      role_de: "Legacy Trainer",
      role_en: "Coach",
    },
    {
      assignments: [
        {
          coachTeamSeasonId: "cts-1",
          teamSeasonId: "ts-1",
          roleDe: "Cheftrainer",
          roleEn: "Head Coach",
          sortOrder: 1,
          isActive: true,
        },
      ],
    },
    [],
    { placeholderImage: "placeholder.png" },
  );

  assert.equal(form.role, "Legacy Trainer");
  assert.deepEqual(form.assignments, [
    {
      coach_team_season_id: "cts-1",
      team_season_id: "ts-1",
      role_de: "Cheftrainer",
      role_en: "Head Coach",
      assignment_sort_order: 1,
      is_active: true,
    },
  ]);
});

test("validateCoachFormState requires a fallback role only for coaches without assignments", () => {
  const requiredFields = {
    first_name: "Vorname",
    last_name: "Nachname",
    nationality: "Nationalitaet",
    email: "E-Mail",
    phone: "Telefonnummer",
    whatsapp: "WhatsApp-Nummer",
  };
  const noAssignmentErrors = validateCoachFormState({
    first_name: "Mira",
    last_name: "Muster",
    nationality: "DE",
    email: "mira@example.test",
    phone: "1",
    whatsapp: "1",
    role: "",
    assignments: [],
  }, requiredFields);
  const withAssignmentErrors = validateCoachFormState({
    first_name: "Mira",
    last_name: "Muster",
    nationality: "DE",
    email: "mira@example.test",
    phone: "1",
    whatsapp: "1",
    role: "",
    assignments: [
      {
        team_season_id: "ts-1",
        role_de: "Trainer",
      },
    ],
  }, requiredFields);

  assert.equal(
    noAssignmentErrors.role,
    "Bitte hinterlege fuer teamlose Trainer eine Fallback-Funktion.",
  );
  assert.equal(withAssignmentErrors.role, undefined);
});

test("createCoachSubmissionPayload keeps assignment roles independent from the fallback role", () => {
  const payload = createCoachSubmissionPayload({
    first_name: "Mira",
    last_name: "Muster",
    role: "Betreuer",
    phone: "0151 123456",
    whatsapp: "0151 123456",
    image_url: "https://example.test/mira.png",
    sort_order: "4",
    is_active: true,
    assignments: [
      {
        coach_team_season_id: "cts-1",
        team_season_id: "ts-1",
        role_de: "Cheftrainer",
        role_en: "",
        assignment_sort_order: "2",
        is_active: true,
      },
    ],
  }, {
    createSlug: (value) => value.toLowerCase().replace(/\s+/g, "-"),
    normalizeGermanPhoneNumber: (value) => value,
    placeholderImage: "placeholder.png",
  });

  assert.equal(payload.role_de, "Betreuer");
  assert.equal(payload.role_en, "Supervisor");
  assert.deepEqual(payload.assignments, [
    {
      coach_team_season_id: "cts-1",
      team_season_id: "ts-1",
      role_de: "Cheftrainer",
      role_en: "Head Coach",
      assignment_sort_order: 2,
      is_active: true,
    },
  ]);
});

test("createCoachAssignmentDraft starts new assignment rows without copying the fallback role", () => {
  assert.deepEqual(createCoachAssignmentDraft(), {
    coach_team_season_id: null,
    team_season_id: "",
    role_de: "",
    role_en: null,
    assignment_sort_order: 0,
    is_active: true,
  });
});
