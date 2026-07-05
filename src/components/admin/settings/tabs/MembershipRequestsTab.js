import MembershipRequestList from "../components/MembershipRequestList";
import MembershipRequestDetails from "../panels/MembershipRequestDetails";

export default function MembershipRequestsTab({
  membershipRequests,
  selectedMembershipRequestId,
  selectedMembershipRequest,
  membershipRequestForm,
  membershipRequestLoading,
  forwardingTargets,
  membershipStatusOptions,
  membershipForwardTypeOptions,
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

      <MembershipRequestDetails
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
  );
}
