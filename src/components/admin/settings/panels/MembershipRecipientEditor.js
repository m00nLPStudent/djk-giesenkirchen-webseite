import MembershipRecipientForm from "../components/MembershipRecipientForm";

export default function MembershipRecipientEditor({
  selectedMembershipRecipient,
  membershipRecipientForm,
  membershipRecipientLoading,
  membershipRequestTypeOptions,
  onSubmit,
  onFieldChange,
  onReset,
  onDelete,
}) {
  return (
    <MembershipRecipientForm
      selectedMembershipRecipient={selectedMembershipRecipient}
      membershipRecipientForm={membershipRecipientForm}
      membershipRecipientLoading={membershipRecipientLoading}
      membershipRequestTypeOptions={membershipRequestTypeOptions}
      onSubmit={onSubmit}
      onFieldChange={onFieldChange}
      onReset={onReset}
      onDelete={onDelete}
    />
  );
}
