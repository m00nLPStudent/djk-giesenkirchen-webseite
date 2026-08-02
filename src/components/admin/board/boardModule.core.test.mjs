import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./boardUi.helpers.js", import.meta.url), "utf8");
const helpers = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const members = [
  { id: "1", first_name: "Anna", last_name: "Aktiv", role_de: "Vorsitzende", email: "anna@example.test", is_active: true },
  { id: "2", first_name: "Ingo", last_name: "Inaktiv", role_de: "Kassierer", is_active: false },
];

test("display name uses only existing first and last names", () => {
  assert.equal(helpers.getBoardMemberName(members[0]), "Anna Aktiv");
  assert.equal(helpers.getBoardMemberName({}), "Vorstandsmitglied");
});

test("summary derives total and existing active states only", () => {
  assert.deepEqual(helpers.getBoardMemberSummary(members), { total: 2, active: 1, inactive: 1 });
});

test("search and active filter preserve the supplied sort order", () => {
  assert.deepEqual(helpers.filterBoardMembers(members, { search: "vorsitz" }).map((member) => member.id), ["1"]);
  assert.deepEqual(helpers.filterBoardMembers(members, { status: "inactive" }).map((member) => member.id), ["2"]);
});
