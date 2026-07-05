import MembershipRecipientForm from "../components/MembershipRecipientForm";
import MembershipRecipientList from "../components/MembershipRecipientList";
import MembershipRequestDetail from "../components/MembershipRequestDetail";
import MembershipRequestList from "../components/MembershipRequestList";
import MembershipSubviewTabs from "../components/MembershipSubviewTabs";

export default function MembershipTab({
  membershipSubview,
  onMembershipSubviewChange,
  membershipRecipients,
  selectedMembershipRecipientId,
  selectedMembershipRecipient,
  membershipRecipientForm,
  membershipRecipientLoading,
  membershipRequests,
  selectedMembershipRequestId,
  selectedMembershipRequest,
  membershipRequestForm,
  membershipRequestLoading,
  forwardingTargets,
  membershipRequestTypeOptions,
  membershipStatusOptions,
  membershipForwardTypeOptions,
  onSelectMembershipRecipient,
  onMembershipRecipientSubmit,
  onMembershipRecipientFieldChange,
  onResetMembershipRecipientForm,
  onDeleteMembershipRecipient,
  onSelectMembershipRequest,
  onMembershipRequestSubmit,
  onMembershipRequestFieldChange,
  onMembershipRequestForward,
  onMarkMembershipRequestDone,
  formatRequestDate,
  getMembershipRequestTypeLabel,
  getMembershipStatusLabel,
  getMembershipForwardTypeLabel,
}) {
  return (
    <div className="space-y-6">
      <MembershipSubviewTabs
        activeTab={membershipSubview}
        onChange={onMembershipSubviewChange}
      />

      {membershipSubview === "recipients" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
          <MembershipRecipientList
            membershipRecipients={membershipRecipients}
            selectedMembershipRecipientId={selectedMembershipRecipientId}
            onSelectRecipient={onSelectMembershipRecipient}
            getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
          />

          <MembershipRecipientForm
            selectedMembershipRecipient={selectedMembershipRecipient}
            membershipRecipientForm={membershipRecipientForm}
            membershipRecipientLoading={membershipRecipientLoading}
            membershipRequestTypeOptions={membershipRequestTypeOptions}
            onSubmit={onMembershipRecipientSubmit}
            onFieldChange={onMembershipRecipientFieldChange}
            onReset={onResetMembershipRecipientForm}
            onDelete={onDeleteMembershipRecipient}
          />
        </div>
      )}

      {membershipSubview === "requests" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
          <MembershipRequestList
            membershipRequests={membershipRequests}
            selectedMembershipRequestId={selectedMembershipRequestId}
            onSelectRequest={onSelectMembershipRequest}
            formatRequestDate={formatRequestDate}
            getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
            getMembershipStatusLabel={getMembershipStatusLabel}
            getMembershipForwardTypeLabel={getMembershipForwardTypeLabel}
          />

          <MembershipRequestDetail
            selectedMembershipRequest={selectedMembershipRequest}
            membershipRequestForm={membershipRequestForm}
            membershipRequestLoading={membershipRequestLoading}
            forwardingTargets={forwardingTargets}
            membershipStatusOptions={membershipStatusOptions}
            membershipForwardTypeOptions={membershipForwardTypeOptions}
            onSubmit={onMembershipRequestSubmit}
            onFieldChange={onMembershipRequestFieldChange}
            onForward={onMembershipRequestForward}
            onMarkDone={onMarkMembershipRequestDone}
            formatRequestDate={formatRequestDate}
            getMembershipForwardTypeLabel={getMembershipForwardTypeLabel}
          />
        </div>
      )}
    </div>
  );
}
