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

test("public club board follows sort_order and maps only the minimal public DTO", () => {
  const members = selectPublicClubBoard([
    club,
    { ...club, first_name: "Anna", sort_order: 10, email: "private-value", phone: "private-value", board_roles: { name_de: "Kassenwartin" } },
  ]);
  assert.deepEqual(members.map((member) => member.name), ["Anna Club", "Clara Club"]);

  const dto = createPublicClubBoardDto({ ...members[0], imageMediaAssetId: "asset" }, new Map(), "/placeholder.png");
  assert.deepEqual(dto, { name: "Anna Club", role: "Kassenwartin", imageUrl: "/placeholder.png" });
  assert.equal("email" in dto, false);
  assert.equal("phone" in dto, false);
  assert.equal("organization_scope" in dto, false);
  assert.equal("department_id" in dto, false);
});
