import MembershipRecipientList from "../components/MembershipRecipientList";
import MembershipRecipientEditor from "../panels/MembershipRecipientEditor";

export default function MembershipRecipientsTab({
  membershipRecipients,
  selectedMembershipRecipientId,
  selectedMembershipRecipient,
  membershipRecipientForm,
  membershipRecipientLoading,
  membershipRequestTypeOptions,
  onSelectMembershipRecipient,
  onMembershipRecipientSubmit,
  onMembershipRecipientFieldChange,
  onResetMembershipRecipientForm,
  onDeleteMembershipRecipient,
  getMembershipRequestTypeLabel,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
      <MembershipRecipientList
        membershipRecipients={membershipRecipients}
        selectedMembershipRecipientId={selectedMembershipRecipientId}
        onSelectRecipient={onSelectMembershipRecipient}
        getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
      />

      <MembershipRecipientEditor
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
  );
}
