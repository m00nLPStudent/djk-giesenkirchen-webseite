"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMetric, AdminModuleFilters, AdminModuleHeader, AdminModulePage, AdminModuleSummary } from "@/components/admin/design-system";
import MembershipRecipientsTab from "@/components/admin/settings/tabs/MembershipRecipientsTab";
import MembershipRequestsTab from "@/components/admin/settings/tabs/MembershipRequestsTab";
import { createMembershipRecipientHandlers } from "@/components/admin/settings/helpers/membershipRecipientHandlers";
import { createMembershipRequestHandlers } from "@/components/admin/settings/helpers/membershipRequestHandlers";
import { createInitialMembershipRecipientForm, createInitialMembershipRequestForm, formatRequestDate, getForwardTargets } from "@/components/admin/settings/helpers/settingsInitialState";
import { MEMBERSHIP_FORWARD_TYPE_OPTIONS, MEMBERSHIP_REQUEST_TYPE_OPTIONS, MEMBERSHIP_STATUS_OPTIONS, getMembershipForwardTypeLabel, getMembershipRequestTypeLabel, getMembershipStatusLabel } from "@/components/admin/settings/helpers/settingsOptions";

export default function MembershipRequestsModule({ initialData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("requests");
  const [status, setStatus] = useState("all");
  const [requests, setRequests] = useState(initialData.requests || []);
  const [recipients, setRecipients] = useState(initialData.recipients || []);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [requestForm, setRequestForm] = useState(createInitialMembershipRequestForm());
  const [recipientForm, setRecipientForm] = useState(createInitialMembershipRecipientForm());
  const [requestLoading, setRequestLoading] = useState(false);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const selectedRequest = useMemo(() => requests.find((item) => item.id === selectedRequestId) || null, [requests, selectedRequestId]);
  const selectedRecipient = useMemo(() => recipients.find((item) => item.id === selectedRecipientId) || null, [recipients, selectedRecipientId]);
  const forwardingTargets = useMemo(() => getForwardTargets(requestForm.forwarded_to_type, initialData.coaches, initialData.boardMembers), [requestForm.forwarded_to_type, initialData.coaches, initialData.boardMembers]);
  const visibleRequests = useMemo(() => requests.filter((item) => status === "all" || item.status === status), [requests, status]);

  const recipientHandlers = createMembershipRecipientHandlers({ router, selectedMembershipRecipientId: selectedRecipientId, selectedMembershipRecipient: selectedRecipient, membershipRecipientForm: recipientForm, setMembershipRecipients: setRecipients, setSelectedMembershipRecipientId: setSelectedRecipientId, setMembershipRecipientForm: setRecipientForm, setMembershipRecipientLoading: setRecipientLoading });
  const requestHandlers = createMembershipRequestHandlers({ router, selectedMembershipRequest: selectedRequest, membershipRequestForm: requestForm, forwardingTargets, setMembershipRequests: setRequests, setSelectedMembershipRequestId: setSelectedRequestId, setMembershipRequestForm: setRequestForm, setMembershipRequestLoading: setRequestLoading });
  const summary = { open: requests.filter((item) => item.status === "new").length, progress: requests.filter((item) => item.status === "in_progress").length, done: requests.filter((item) => item.status === "done").length, forwarded: requests.filter((item) => Boolean(item.forwarded_at)).length };

  return <AdminModulePage>
    <AdminModuleHeader eyebrow="Gesamtverein" title="Mitgliedsanfragen" description="Mitgliedsanfragen, Empfänger und Weiterleitungen verwalten." />
    <AdminModuleSummary><AdminMetric label="Offen" value={summary.open} /><AdminMetric label="In Bearbeitung" value={summary.progress} /><AdminMetric label="Erledigt" value={summary.done} /><AdminMetric label="Weitergeleitet" value={summary.forwarded} /></AdminModuleSummary>
    <div role="tablist" aria-label="Membership-Bereiche" className="inline-flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {[{ id: "requests", label: "Anfragen" }, { id: "recipients", label: "Empfänger" }].map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-10 rounded-full px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${activeTab === tab.id ? "bg-red-600 text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`}>{tab.label}</button>)}
    </div>
    {activeTab === "requests" ? <><AdminModuleFilters title="Anfragen filtern" panelId="membership-request-filters"><label className="grid max-w-sm gap-2 text-sm font-bold text-white/65">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle</option>{MEMBERSHIP_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></AdminModuleFilters><MembershipRequestsTab membershipRequests={visibleRequests} selectedMembershipRequestId={selectedRequestId} selectedMembershipRequest={selectedRequest} membershipRequestForm={requestForm} membershipRequestLoading={requestLoading} forwardingTargets={forwardingTargets} membershipStatusOptions={MEMBERSHIP_STATUS_OPTIONS} membershipForwardTypeOptions={MEMBERSHIP_FORWARD_TYPE_OPTIONS} onSelectMembershipRequest={requestHandlers.selectMembershipRequest} onMembershipRequestSubmit={requestHandlers.handleMembershipRequestSave} onMembershipRequestFieldChange={requestHandlers.updateMembershipRequestField} onMembershipRequestForward={requestHandlers.handleMembershipRequestForward} onMarkMembershipRequestDone={requestHandlers.markMembershipRequestDone} formatRequestDate={formatRequestDate} getMembershipRequestTypeLabel={getMembershipRequestTypeLabel} getMembershipStatusLabel={getMembershipStatusLabel} getMembershipForwardTypeLabel={getMembershipForwardTypeLabel} /></> : null}
    {activeTab === "recipients" ? <MembershipRecipientsTab membershipRecipients={recipients} selectedMembershipRecipientId={selectedRecipientId} selectedMembershipRecipient={selectedRecipient} membershipRecipientForm={recipientForm} membershipRecipientLoading={recipientLoading} membershipRequestTypeOptions={MEMBERSHIP_REQUEST_TYPE_OPTIONS} onSelectMembershipRecipient={recipientHandlers.selectMembershipRecipient} onMembershipRecipientSubmit={recipientHandlers.handleMembershipRecipientSave} onMembershipRecipientFieldChange={recipientHandlers.updateMembershipRecipientField} onResetMembershipRecipientForm={recipientHandlers.resetMembershipRecipientForm} onDeleteMembershipRecipient={recipientHandlers.handleMembershipRecipientDelete} getMembershipRequestTypeLabel={getMembershipRequestTypeLabel} /> : null}
  </AdminModulePage>;
}
