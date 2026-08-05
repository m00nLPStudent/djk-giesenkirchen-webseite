import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { buildActiveTypes, buildNotificationHealth, buildTopErrors, filterMonitoringEntries } from "../monitoring/notificationMonitoring.core.mjs";
import { filterInputsWithPreferenceMap } from "../preferences/notificationPreferencePolicy.mjs";
import { checkAuditConsistency, createSyntheticAuditRows, deduplicateSyntheticRecipients, normalizePageRequest } from "./notificationHardening.core.mjs";
import { disabledMandatoryPreferences, multiRoleRecipients, optionalPreferences, teamRecipients, users } from "./notificationHardening.fixtures.mjs";

const inputs=(type)=>deduplicateSyntheticRecipients(teamRecipients,users.actor).map((recipientUserId)=>({recipientUserId,type}));
test("multiple team recipients are deduplicated by auth user and exclude actor",()=>assert.deepEqual(deduplicateSyntheticRecipients([...teamRecipients,users.actor],users.actor),[users.trainerA,users.trainerB,users.coachC,users.caretakerD]));
test("different optional preferences produce two deliveries and two skips",()=>{ const result=filterInputsWithPreferenceMap(inputs("player_assigned"),optionalPreferences); assert.equal(result.allowed.length,2); assert.equal(result.skipped.length,2); });
test("mandatory notifications ignore stored false preferences",()=>{ const result=filterInputsWithPreferenceMap(inputs("trainer_removed"),disabledMandatoryPreferences); assert.equal(result.allowed.length,4); assert.equal(result.skipped.length,0); });
test("multiple roles cannot duplicate one auth user",()=>assert.deepEqual(deduplicateSyntheticRecipients(multiRoleRecipients.map((item)=>item.userId)),[users.trainerA,users.trainerB]));
test("unknown types remain deliverable",()=>assert.equal(filterInputsWithPreferenceMap([{recipientUserId:users.trainerA,type:"future_type"}],new Map([[`${users.trainerA}:future_type`,false]])).allowed.length,1));
test("audit consistency validates preference and delivery equations",()=>{ assert.equal(checkAuditConsistency({preferenceAnalysis:{inputCount:4,skippedCount:2,outputCount:2},successfulCount:2,failedCount:0}).valid,true); assert.equal(checkAuditConsistency({preferenceAnalysis:{inputCount:4,skippedCount:1,outputCount:2},successfulCount:2}).valid,false); });
test("server page bounds reject unlimited client payloads",()=>{ assert.deepEqual(normalizePageRequest(-2,10000),{page:1,pageSize:250}); assert.deepEqual(normalizePageRequest(3,50),{page:3,pageSize:50}); });
for (const size of [100,1000,10000]) test(`monitoring mappings remain bounded for ${size} synthetic rows`,()=>{ const rows=createSyntheticAuditRows(size); const started=performance.now(); filterMonitoringEntries(rows,{range:"all",search:"",status:"all"}); buildNotificationHealth(rows); buildTopErrors(rows); buildActiveTypes(rows); const duration=performance.now()-started; assert.ok(duration<1500,`mapping took ${duration.toFixed(1)} ms`); });
