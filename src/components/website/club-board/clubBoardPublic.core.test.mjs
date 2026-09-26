import assert from "node:assert/strict";
import test from "node:test";
import { createPublicClubBoardDto, selectPublicClubBoard } from "./clubBoardPublic.core.mjs";

const club = { first_name: "Clara", last_name: "Club", role_de: "Vorsitz", organization_scope: "club", department_id: null, is_active: true, sort_order: 20 };

test("public club board is fail-closed to active club records without department", () => {
  const result = selectPublicClubBoard([
    club,
    { ...club, first_name: "Football", organization_scope: "department", department_id: "football" },
    { ...club, first_name: "Tischtennis", organization_scope: "department", department_id: "tt" },
    { ...club, first_name: "Unassigned", organization_scope: "unassigned" },
    { ...club, first_name: "Inactive", is_active: false },
    { ...club, first_name: "Invalid", department_id: "department" },
  ]);

  assert.deepEqual(result.map((member) => member.name), ["Clara Club"]);
});

test("public club board follows sort_order and maps only the active public board DTO", () => {
  const members = selectPublicClubBoard([
    club,
    { ...club, first_name: "Anna", sort_order: 10, email: " anna@example.test ", phone: " 02161 123 ", board_roles: { name_de: "Kassenwartin" } },
  ]);
  assert.deepEqual(members.map((member) => member.name), ["Anna Club", "Clara Club"]);

  const dto = createPublicClubBoardDto({ ...members[0], imageMediaAssetId: "asset" }, new Map(), "/placeholder.png");
  assert.deepEqual(dto, { name: "Anna Club", role: "Kassenwartin", phone: "02161 123", email: "anna@example.test", imageUrl: "/placeholder.png", responsibilities: [] });
  assert.equal("organization_scope" in dto, false);
  assert.equal("department_id" in dto, false);
});

test("public club board contact DTO supports both, either or no contact without placeholders", () => {
  const cases = [
    { phone: "02161 1", email: "both@example.test" },
    { phone: "02161 2", email: null },
    { phone: null, email: "mail@example.test" },
    { phone: null, email: null },
  ];

  for (const contacts of cases) {
    const [selected] = selectPublicClubBoard([{ ...club, ...contacts }]);
    const dto = createPublicClubBoardDto(selected, new Map(), "/placeholder.png");
    assert.equal(dto.phone, contacts.phone);
    assert.equal(dto.email, contacts.email);
  }
});

test("contacts of non-public board records remain excluded with the record", () => {
  const result = selectPublicClubBoard([
    { ...club, is_active: false, phone: "02161 999", email: "hidden@example.test" },
    { ...club, organization_scope: "department", department_id: "football", phone: "02161 888", email: "wrong-scope@example.test" },
  ]);

  assert.deepEqual(result, []);
});
