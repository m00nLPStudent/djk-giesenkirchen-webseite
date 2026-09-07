import assert from "node:assert/strict";
import test from "node:test";
import { createPublicDepartmentSectionDto, normalizePublicDepartmentTraining, selectPublicDepartmentTraining } from "./departmentSectionPublic.core.mjs";

const section = { department_slug: "behindertensport", title_de: " Behindertensport ", description_de: " Gemeinsam aktiv. ", contact_is_public: true, contact_name: "Kontakt", contact_email: "kontakt@example.test", contact_phone: "0123" };
const training = { department_id: "disabled", weekday: 2, start_time: "18:00:00", end_time: "19:30:00", location_name: "Halle", location_address: "Straße 1", location_city: "Mönchengladbach", location_note: "Hinweis", effective_from: null, effective_until: null, is_active: true };

test("public DTO contains only normalized presentation fields", () => {
  const dto = createPublicDepartmentSectionDto(section, [training], "https://media.test/group.webp", { departmentId: "disabled", today: "2026-09-05" });
  assert.deepEqual(Object.keys(dto), ["section", "contact", "trainingTimes"]);
  assert.deepEqual(dto.section, { title: "Behindertensport", description: "Gemeinsam aktiv.", imageUrl: "https://media.test/group.webp" });
  assert.equal(dto.trainingTimes[0].weekday, "Dienstag");
  assert.equal(JSON.stringify(dto).includes("department_id"), false);
});

test("private contact values never enter the public DTO", () => {
  const dto = createPublicDepartmentSectionDto({ ...section, contact_is_public: false }, [], null, { departmentId: "disabled" });
  assert.deepEqual(dto.contact, { public: false, name: null, email: null, phone: null });
});

test("training selection rejects inactive, future, expired and foreign rows", () => {
  const rows = [training, { ...training, is_active: false }, { ...training, effective_from: "2026-09-06" }, { ...training, effective_until: "2026-09-04" }, { ...training, department_id: "football" }];
  assert.deepEqual(selectPublicDepartmentTraining(rows, { departmentId: "disabled", today: "2026-09-05" }), [training]);
});

test("training formatting uses German weekdays and omits empty optional values", () => {
  assert.deepEqual(normalizePublicDepartmentTraining({ weekday: 7, start_time: "09:00:00", end_time: "10:30:00" }), { weekday: "Sonntag", weekdayNumber: 7, startTime: "09:00", endTime: "10:30", location: null, address: null, city: null, note: null });
});

test("invalid sections fail closed", () => {
  assert.equal(createPublicDepartmentSectionDto({}, [], null, { departmentId: "disabled" }), null);
});
