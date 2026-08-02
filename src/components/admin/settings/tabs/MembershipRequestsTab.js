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
    <div className={`grid min-w-0 gap-6 ${selectedMembershipRequest ? "xl:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]" : "grid-cols-1"}`}>
      <MembershipRequestList
        membershipRequests={membershipRequests}
        selectedMembershipRequestId={selectedMembershipRequestId}
        onSelectRequest={onSelectMembershipRequest}
        formatRequestDate={formatRequestDate}
        getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
        getMembershipStatusLabel={getMembershipStatusLabel}
        getMembershipForwardTypeLabel={getMembershipForwardTypeLabel}
        compact={Boolean(selectedMembershipRequest)}
      />

      {selectedMembershipRequest ? <MembershipRequestDetails
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
      /> : null}
    </div>
  );
}
