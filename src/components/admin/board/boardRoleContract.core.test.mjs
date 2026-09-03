import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_OWN_CARD_FIELDS,
  buildOwnBoardCardPayload,
  canAccessBoardMember,
  isBoardGlobalBusinessManager,
} from "./boardRoleContract.core.mjs";

const member = { admin_profile_id: "profile-1", organization_scope: "department", department_id: "football", role_id: "role-1", role_de: "Vorstand", role_en: "Board", is_active: true, sort_order: 10 };

test("superadmin stays technically global while vorstand receives only board global business", () => {
  assert.equal(isBoardGlobalBusinessManager({ isGlobal: true, roleKeys: ["superadmin"] }), true);
  assert.equal(isBoardGlobalBusinessManager({ isGlobal: false, roleKeys: ["vorstand"] }), true);
  assert.equal(isBoardGlobalBusinessManager({ isGlobal: false, roleKeys: ["fussball-vorstand"] }), false);
});

test("vorstand can access assigned and club board records but not unassigned", () => {
  const context = { roleKeys: ["vorstand"] };
  assert.equal(canAccessBoardMember(context, { organization_scope: "club" }), true);
  assert.equal(canAccessBoardMember(context, { organization_scope: "department" }), true);
  assert.equal(canAccessBoardMember(context, { organization_scope: "unassigned" }), false);
});

test("department board roles can access only their linked own card", () => {
  const context = { roleKeys: ["fussball-vorstand"], adminProfileId: "profile-1" };
  assert.equal(canAccessBoardMember(context, member), true);
  assert.equal(canAccessBoardMember(context, { ...member, admin_profile_id: "profile-2" }), false);
  assert.equal(canAccessBoardMember({ roleKeys: ["kassierer"], adminProfileId: "profile-1" }, member), false);
  assert.equal(canAccessBoardMember({ roleKeys: ["webmaster"], adminProfileId: "profile-1" }, member), false);
});

test("own-card payload permits only personal presentation fields", () => {
  assert.deepEqual(BOARD_OWN_CARD_FIELDS, ["first_name", "last_name", "email", "phone", "image_media_asset_id"]);
  assert.deepEqual(buildOwnBoardCardPayload({ first_name: "Neu", email: "neu@example.test" }, member), {
    ok: true,
    data: { first_name: "Neu", email: "neu@example.test" },
  });
  for (const [field, value] of Object.entries({ admin_profile_id: "other", organization_scope: "club", department_id: "other", role_id: "other", role_de: "Other", role_en: "Other", is_active: false, sort_order: 99 })) {
    assert.equal(buildOwnBoardCardPayload({ [field]: value }, member).ok, false, field);
  }
});
