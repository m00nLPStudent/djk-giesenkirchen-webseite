import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createTeamCoachListDto } from "../persons/coachReadDto.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../../app/admin/teams/[id]/page.js");
const repository = read("./teamCoachList.repository.js");
const teamDetail = read("./components/TeamContributionDetailView.js");
const coachDetail = read("../coaches/components/CoachDetailOverview.js");

test("compact team coach DTO exposes only list-safe fields", () => {
  const dto = createTeamCoachListDto(
    { id: "c1", first_name: "Mira", last_name: "Muster", image_url: "/mira.jpg", license: "C-Lizenz", is_active: true, email: "private@example.test", notes: "intern" },
    { role_de: "Co-Trainer", is_active: true },
    { teamName: "U17", seasonLabel: "2026/27", canOpen: true },
  );

  assert.equal(dto.assignmentRoleLabel, "Co-Trainer");
  assert.equal(dto.detailHref, "/admin/coaches/edit/c1");
  assert.deepEqual(Object.keys(dto), ["id", "slug", "displayName", "imageUrl", "assignmentRole", "assignmentRoleLabel", "isActive", "licenseLabel", "teamName", "seasonLabel", "detailHref"]);
  assert.equal("email" in dto, false);
  assert.equal("notes" in dto, false);
});

test("team coach read path batches current active assignments and coaches", () => {
  assert.match(repository, /\.eq\("team_season_id", teamSeasonId\)/);
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /\.in\("id", coachIds\)/);
  assert.equal((repository.match(/\.from\("coach_team_seasons"\)|\.from\("coaches"\)/g) || []).length, 2);
  assert.doesNotMatch(repository, /for[\s\S]*await/);
  assert.match(page, /coaches=\{coachRows\}/);
});

test("team detail renders matching desktop rows, mobile cards and empty state", () => {
  for (const label of ["Trainer und Betreuer", "Profil", "Name", "Funktion", "Lizenz", "Status", "Übersicht"]) assert.ok(teamDetail.includes(label));
  for (const primitive of ["CoachAvatar", "AdminModuleList", "AdminModuleCards", "AdminListRow", "AdminListMobileCard", "AdminModuleEmptyState"]) assert.ok(teamDetail.includes(primitive));
  assert.doesNotMatch(teamDetail, /coach\.email|coach\.phone|coach\.notes|ContributionStatusBadge[^\n]*coach/);
});

test("coach detail separates profile data and keeps archive action in danger zone", () => {
  for (const section of ["Persönliche Daten", "Kontakt", "Mannschaftszuordnungen", "Lizenzen", "Notizen", "Historie"]) assert.ok(coachDetail.includes(section));
  assert.match(coachDetail, /Trainer archivieren/);
  assert.match(coachDetail, /<ArchiveButton entity="coach"/);
  assert.match(coachDetail, /AdminDangerZone/);
  assert.doesNotMatch(coachDetail, /Beitrag öffnen|Contribution-Summary|dauerhaft löschen/);
});
