import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [card, section, hero, repository, readModel, dto, departmentHelpers] =
  await Promise.all([
    read("./TeamCoachCard.js"),
    read("./TeamCoachSection.js"),
    read("./TeamHero.js"),
    read("../coach/coachPublic.repository.js"),
    read("../../admin/persons/coachSeasonalReadModelRepository.js"),
    read("../../admin/persons/coachReadDto.js"),
    read("../department/department.helpers.js"),
  ]);

test("team coach cards reserve two name lines and align variable contact content", () => {
  assert.match(card, /nameLines\.firstName/);
  assert.match(card, /nameLines\.lastName/);
  assert.equal((card.match(/min-h-7/g) || []).length, 2);
  assert.match(card, /flex h-full flex-col/);
  assert.match(card, /mt-auto flex flex-wrap gap-3 pt-6/);
  assert.match(section, /md:grid-cols-2 xl:grid-cols-3/);
});

test("team hero fills the frame and favors the upper group-photo area", () => {
  assert.match(hero, /object-cover/);
  assert.match(hero, /object-\[center_35%\]/);
  assert.match(hero, /sm:object-\[center_32%\]/);
  assert.match(hero, /md:object-\[center_30%\]/);
  assert.doesNotMatch(hero, /object-contain/);
  assert.match(hero, /border border-white\/10 bg-black/);
  assert.match(hero, /bg-gradient-to-t/);
  assert.match(hero, /<TeamImagePlaceholder/);
  assert.match(hero, /h-52 w-full[\s\S]*sm:h-72[\s\S]*md:h-\[500px\]/);
});

test("public coach sorting consumes existing team and assignment ordering", () => {
  assert.match(readModel, /sort_order, department_id/);
  assert.match(dto, /teamSortOrder/);
  assert.match(repository, /sortPublicCoachesByPrimaryTeam/);
  assert.doesNotMatch(repository, /Mini-Kickers|Bambini|G-Jugend|F-Jugend/);
});

test("multi-team badge contract remains unchanged", () => {
  assert.match(
    departmentHelpers,
    /primaryTeamName.*teamNames\.length - 1.*weitere/s,
  );
});
