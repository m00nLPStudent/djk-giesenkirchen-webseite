import MembershipRequestDetail from "../components/MembershipRequestDetail";

export default function MembershipRequestDetails({
  selectedMembershipRequest,
  membershipRequestForm,
  membershipRequestLoading,
  forwardingTargets,
  membershipStatusOptions,
  membershipForwardTypeOptions,
  onSubmit,
  onFieldChange,
  onForward,
  onMarkDone,
  formatRequestDate,
  getMembershipForwardTypeLabel,
}) {
  return (
    <MembershipRequestDetail
      selectedMembershipRequest={selectedMembershipRequest}
      membershipRequestForm={membershipRequestForm}
      membershipRequestLoading={membershipRequestLoading}
      forwardingTargets={forwardingTargets}
      membershipStatusOptions={membershipStatusOptions}
      membershipForwardTypeOptions={membershipForwardTypeOptions}
      onSubmit={onSubmit}
      onFieldChange={onFieldChange}
      onForward={onForward}
      onMarkDone={onMarkDone}
      formatRequestDate={formatRequestDate}
      getMembershipForwardTypeLabel={getMembershipForwardTypeLabel}
    />
  );
}
