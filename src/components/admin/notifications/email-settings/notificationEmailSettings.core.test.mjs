import test from "node:test";
import assert from "node:assert/strict";
import { buildNotificationEmailSettingsDto, hasActiveSuperadminRole, isKnownNotificationEmailSettingType, notificationEmailSettingDefinitions, recommendedNotificationEmailSettings, resolveNotificationEmailDeliveryPolicy } from "./notificationEmailSettings.core.mjs";

test("registry contains exactly the D8 27-type matrix", () => {
  assert.equal(notificationEmailSettingDefinitions.length, 27);
  assert.equal(new Set(notificationEmailSettingDefinitions.map(({ type }) => type)).size, 27);
  assert.equal(notificationEmailSettingDefinitions.filter(({ recommended }) => recommended).length, 16);
  assert.equal(notificationEmailSettingDefinitions.filter(({ recommended }) => !recommended).length, 11);
  assert.equal(isKnownNotificationEmailSettingType(" event_updated "), true);
  assert.equal(isKnownNotificationEmailSettingType("future_type"), false);
});

test("DTO uses database state as source of truth and missing rows are disabled", () => {
  const dto = buildNotificationEmailSettingsDto({ setting_key: "global", email_delivery_enabled: true }, [{ notification_type: "event_updated", email_enabled: true }]);
  assert.equal(dto.masterEnabled, true);
  assert.equal(dto.items.find(({ type }) => type === "event_updated").enabled, true);
  assert.equal(dto.items.find(({ type }) => type === "membership_created").enabled, false);
});

test("delivery policy is deny-by-default", () => {
  assert.deepEqual(resolveNotificationEmailDeliveryPolicy(null, [], "event_updated"), { globalEnabled: false, typeEnabled: false });
  assert.deepEqual(resolveNotificationEmailDeliveryPolicy({ setting_key: "global", email_delivery_enabled: true }, [], "event_updated"), { globalEnabled: true, typeEnabled: false });
  assert.deepEqual(resolveNotificationEmailDeliveryPolicy({ setting_key: "global", email_delivery_enabled: true }, [{ notification_type: "event_updated", email_enabled: true }], "event_updated"), { globalEnabled: true, typeEnabled: true });
});

test("recommended restore is a fresh exact 16/11 matrix", () => {
  const first = recommendedNotificationEmailSettings();
  first[0].email_enabled = false;
  const second = recommendedNotificationEmailSettings();
  assert.equal(second.length, 27);
  assert.equal(second.filter(({ email_enabled }) => email_enabled).length, 16);
});

test("only an active superadmin role satisfies the mutation boundary", () => {
  assert.equal(hasActiveSuperadminRole([{ key: "superadmin", is_active: true }]), true);
  for (const roles of [[], [{ key: "trainer", is_active: true }], [{ key: "vorstand", is_active: true }], [{ key: "kassierer", is_active: true }], [{ key: "superadmin", is_active: false }]]) assert.equal(hasActiveSuperadminRole(roles), false);
});
