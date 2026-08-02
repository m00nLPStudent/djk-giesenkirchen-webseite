import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const settingsPage = read("../../../app/admin/settings/page.js");
const settingsEditor = read("../settings/AdminSettingsEditor.js");
const moduleSource = read("./MembershipRequestsModule.js");
const loader = read("./membershipRequests.loader.js");
const navigation = read("../navigation/adminNavigation.config.js");
const requestList = read("../settings/components/MembershipRequestList.js");
const requestDetail = read("../settings/components/MembershipRequestDetail.js");
const recipientList = read("../settings/components/MembershipRecipientList.js");
const recipientForm = read("../settings/components/MembershipRecipientForm.js");
const requestTab = read("../settings/tabs/MembershipRequestsTab.js");
const recipientTab = read("../settings/tabs/MembershipRecipientsTab.js");

test("settings loader and editor contain no membership data path", () => {
  assert.doesNotMatch(settingsPage, /membership_requests|membership_request_recipients|initialMembership/);
  assert.doesNotMatch(settingsEditor, /MembershipRequests|MembershipRecipients|membershipSubview/);
  assert.match(settingsEditor, /ClubSettingsTab/);
  assert.match(settingsEditor, /ClubContactsTab/);
  assert.match(settingsEditor, /PagesTab/);
});

test("membership loader checks central policy before all domain queries", () => {
  const policyIndex = loader.indexOf("canAccessMembershipRequests(context)");
  for (const query of ["membership_requests", "membership_request_recipients", "coaches", "board_members"]) {
    assert.ok(loader.indexOf(query) > policyIndex);
  }
  assert.match(loader, /serializable/);
});

test("new module exposes real summary tabs requests recipients and forwarding", () => {
  assert.match(moduleSource, /title="Mitgliedsanfragen"/);
  assert.match(moduleSource, /AdminModuleSummary/);
  assert.match(moduleSource, /status === "new"/);
  assert.match(moduleSource, /status === "in_progress"/);
  assert.match(moduleSource, /status === "done"/);
  assert.match(moduleSource, /MembershipRequestsTab/);
  assert.match(moduleSource, /MembershipRecipientsTab/);
  assert.match(moduleSource, /handleMembershipRequestForward/);
  assert.doesNotMatch(moduleSource, /AdminModuleSearch|type="search"/);
  assert.match(moduleSource, /role="tablist"/);
  assert.match(moduleSource, /aria-selected/);
  assert.match(moduleSource, /AdminModuleFilters/);
});

test("membership lists use shared responsive primitives and status chips", () => {
  for (const source of [requestList, recipientList]) {
    for (const component of ["AdminModuleList", "AdminModuleCards", "AdminListRow", "AdminListMobileCard", "AdminListChevron", "AdminModuleEmptyState", "AdminStatusChip"]) assert.match(source, new RegExp(component));
    assert.match(source, /xl:hidden/);
    assert.match(source, /hidden overflow-hidden xl:block/);
  }
  assert.doesNotMatch(requestList, /email|phone|internal_note/i);
});

test("request detail uses the shared detail system and visual forwarding targets", () => {
  for (const component of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminStatusChip", "AdminActionBar", "AdminModuleEmptyState", "CoachAvatar"]) assert.match(requestDetail, new RegExp(component));
  assert.match(requestDetail, /type="radio"/);
  assert.match(requestDetail, /Keine Weiterleitung vorhanden/);
  assert.doesNotMatch(requestDetail, /FormSection|SectionHeader|EntityBadge/);
});

test("recipient editor uses shared details actions danger zone and empty list", () => {
  for (const component of ["AdminDetailLayout", "AdminDetailHeader", "AdminInformationSection", "AdminInformationRow", "AdminActionBar", "AdminButton", "AdminDangerZone", "AdminStatusChip"]) assert.match(recipientForm, new RegExp(component));
  assert.match(recipientList, /AdminModuleEmptyState/);
});

test("both tabs keep the responsive 35 to 65 percent master detail layout", () => {
  for (const source of [requestTab, recipientTab]) assert.match(source, /minmax\(0,35fr\).*minmax\(0,65fr\)/);
  assert.match(requestTab, /selectedMembershipRequest \?/);
  assert.match(requestTab, /: "grid-cols-1"/);
  assert.match(requestTab, /selectedMembershipRequest \? <MembershipRequestDetails/);
  assert.match(requestList, /if \(compact\) return cards/);
  assert.match(requestList, /border-l-2 border-red-500/);
});

test("forwarding cards resolve current and historical targets without the old unknown fallback", () => {
  assert.match(requestDetail, /target\?\.displayName \|\| request\.forwarded_to_name \|\| request\.forwarded_to_email \|\| "Zielperson nicht mehr verfügbar"/);
  assert.match(requestDetail, /space-y-5 px-1 pb-2 pt-1/);
  assert.match(requestDetail, /sm:grid-cols-2/);
  assert.match(requestDetail, /break-all/);
  assert.doesNotMatch(requestDetail, /Unbekannte Person/);
});

test("navigation activates only the canonical membership route", () => {
  assert.match(navigation, /"\/admin\/membership-requests"/);
  assert.match(navigation, /accessPolicy: "membership_requests"/);
  assert.doesNotMatch(navigation, /planned\("membership-requests"/);
});
