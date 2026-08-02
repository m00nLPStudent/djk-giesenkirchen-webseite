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
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
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
