"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import {
  CLUB_CONTACT_PLACEHOLDER_IMAGE,
  deleteClubContactImage,
  uploadClubContactImage,
} from "./settings.service";
import MembershipSubviewTabs from "./components/MembershipSubviewTabs";
import SettingsTabs from "./components/SettingsTabs";
import {
  CONTACT_CATEGORY_OPTIONS,
  MEMBERSHIP_FORWARD_TYPE_OPTIONS,
  MEMBERSHIP_REQUEST_TYPE_OPTIONS,
  MEMBERSHIP_STATUS_OPTIONS,
  ROLE_TEMPLATES,
  SETTINGS_TABS,
  getCategoryLabel,
  getMembershipForwardTypeLabel,
  getMembershipRequestTypeLabel,
  getMembershipStatusLabel,
} from "./helpers/settingsOptions";
import {
  createClubSettingsForm,
  createInitialContactForm,
  createInitialMembershipRecipientForm,
  createInitialMembershipRequestForm,
  createInitialPageForm,
  formatRequestDate,
  getForwardTargets,
} from "./helpers/settingsInitialState";
import { createSettingsHandlers } from "./helpers/settingsHandlers";
import ClubContactsTab from "./tabs/ClubContactsTab";
import ClubSettingsTab from "./tabs/ClubSettingsTab";
import MembershipRecipientsTab from "./tabs/MembershipRecipientsTab";
import MembershipRequestsTab from "./tabs/MembershipRequestsTab";
import PagesTab from "./tabs/PagesTab";

export default function AdminSettingsEditor({
  initialClubSettings,
  initialClubContacts = [],
  initialPages = [],
  initialMembershipRecipients = [],
  initialMembershipRequests = [],
  initialCoaches = [],
  initialBoardMembers = [],
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("club");
  const [membershipSubview, setMembershipSubview] = useState("recipients");
  const [clubSettings, setClubSettings] = useState(initialClubSettings);
  const [clubForm, setClubForm] = useState(() =>
    createClubSettingsForm(initialClubSettings),
  );
  const [clubLoading, setClubLoading] = useState(false);
  const [contacts, setContacts] = useState(initialClubContacts);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactForm, setContactForm] = useState(createInitialContactForm());
  const [contactLoading, setContactLoading] = useState(false);
  const [pages, setPages] = useState(initialPages);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageForm, setPageForm] = useState(createInitialPageForm());
  const [pageLoading, setPageLoading] = useState(false);
  const [membershipRecipients, setMembershipRecipients] = useState(
    initialMembershipRecipients,
  );
  const [selectedMembershipRecipientId, setSelectedMembershipRecipientId] =
    useState(null);
  const [membershipRecipientForm, setMembershipRecipientForm] = useState(
    createInitialMembershipRecipientForm(),
  );
  const [membershipRecipientLoading, setMembershipRecipientLoading] =
    useState(false);
  const [membershipRequests, setMembershipRequests] = useState(
    initialMembershipRequests,
  );
  const [selectedMembershipRequestId, setSelectedMembershipRequestId] =
    useState(null);
  const [membershipRequestForm, setMembershipRequestForm] = useState(
    createInitialMembershipRequestForm(),
  );
  const [membershipRequestLoading, setMembershipRequestLoading] =
    useState(false);

  const selectedContact = useMemo(
    () => contacts.find((item) => item.id === selectedContactId) || null,
    [contacts, selectedContactId],
  );
  const selectedPage = useMemo(
    () => pages.find((item) => item.id === selectedPageId) || null,
    [pages, selectedPageId],
  );
  const selectedMembershipRecipient = useMemo(
    () =>
      membershipRecipients.find(
        (item) => item.id === selectedMembershipRecipientId,
      ) || null,
    [membershipRecipients, selectedMembershipRecipientId],
  );
  const selectedMembershipRequest = useMemo(
    () =>
      membershipRequests.find(
        (item) => item.id === selectedMembershipRequestId,
      ) || null,
    [membershipRequests, selectedMembershipRequestId],
  );
  const forwardingTargets = useMemo(
    () =>
      getForwardTargets(
        membershipRequestForm.forwarded_to_type,
        initialCoaches,
        initialBoardMembers,
      ),
    [
      initialBoardMembers,
      initialCoaches,
      membershipRequestForm.forwarded_to_type,
    ],
  );

  const handlers = createSettingsHandlers({
    router,
    clubSettings,
    clubForm,
    setClubSettings,
    setClubForm,
    setClubLoading,
    selectedContactId,
    selectedContact,
    contactForm,
    setContacts,
    setSelectedContactId,
    setContactForm,
    setContactLoading,
    selectedPageId,
    selectedPage,
    pageForm,
    setPages,
    setSelectedPageId,
    setPageForm,
    setPageLoading,
    selectedMembershipRecipientId,
    selectedMembershipRecipient,
    membershipRecipientForm,
    setMembershipRecipients,
    setSelectedMembershipRecipientId,
    setMembershipRecipientForm,
    setMembershipRecipientLoading,
    selectedMembershipRequest,
    membershipRequestForm,
    forwardingTargets,
    setMembershipRequests,
    setSelectedMembershipRequestId,
    setMembershipRequestForm,
    setMembershipRequestLoading,
  });

  const { uploadImage: uploadContactImage, removeImage: removeContactImage } =
    useImageUpload({
      currentUrl: contactForm.image_url,
      placeholderUrl: CLUB_CONTACT_PLACEHOLDER_IMAGE,
      uploadAction: uploadClubContactImage,
      deleteAction: deleteClubContactImage,
      onChange: (url) => handlers.updateContactField("image_url", url),
      getUploadContext: () => ({
        id: selectedContactId,
        role_de: contactForm.role_de,
        contact_name: contactForm.contact_name,
      }),
    });

  return (
    <div className="space-y-6">
      <SettingsTabs
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "club" && (
        <ClubSettingsTab
          clubForm={clubForm}
          clubLoading={clubLoading}
          onSubmit={handlers.handleClubSave}
          onFieldChange={handlers.updateClubField}
        />
      )}

      {activeTab === "contacts" && (
        <ClubContactsTab
          contacts={contacts}
          selectedContactId={selectedContactId}
          selectedContact={selectedContact}
          contactForm={contactForm}
          contactLoading={contactLoading}
          roleTemplates={ROLE_TEMPLATES}
          contactCategoryOptions={CONTACT_CATEGORY_OPTIONS}
          placeholderUrl={CLUB_CONTACT_PLACEHOLDER_IMAGE}
          onSelectContact={handlers.selectContact}
          onContactSubmit={handlers.handleContactSave}
          onContactFieldChange={handlers.updateContactField}
          onContactRoleTemplateChange={handlers.updateContactRoleTemplate}
          onContactImageUpload={uploadContactImage}
          onContactImageRemove={removeContactImage}
          onResetContactForm={handlers.resetContactForm}
          onDeleteContact={handlers.handleContactDelete}
          getCategoryLabel={getCategoryLabel}
        />
      )}

      {activeTab === "membership" && (
        <div className="space-y-6">
          <MembershipSubviewTabs
            activeTab={membershipSubview}
            onChange={setMembershipSubview}
          />

          {membershipSubview === "recipients" && (
            <MembershipRecipientsTab
              membershipRecipients={membershipRecipients}
              selectedMembershipRecipientId={selectedMembershipRecipientId}
              selectedMembershipRecipient={selectedMembershipRecipient}
              membershipRecipientForm={membershipRecipientForm}
              membershipRecipientLoading={membershipRecipientLoading}
              membershipRequestTypeOptions={MEMBERSHIP_REQUEST_TYPE_OPTIONS}
              onSelectMembershipRecipient={handlers.selectMembershipRecipient}
              onMembershipRecipientSubmit={
                handlers.handleMembershipRecipientSave
              }
              onMembershipRecipientFieldChange={
                handlers.updateMembershipRecipientField
              }
              onResetMembershipRecipientForm={
                handlers.resetMembershipRecipientForm
              }
              onDeleteMembershipRecipient={
                handlers.handleMembershipRecipientDelete
              }
              getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
            />
          )}

          {membershipSubview === "requests" && (
            <MembershipRequestsTab
              membershipRequests={membershipRequests}
              selectedMembershipRequestId={selectedMembershipRequestId}
              selectedMembershipRequest={selectedMembershipRequest}
              membershipRequestForm={membershipRequestForm}
              membershipRequestLoading={membershipRequestLoading}
              forwardingTargets={forwardingTargets}
              membershipStatusOptions={MEMBERSHIP_STATUS_OPTIONS}
              membershipForwardTypeOptions={MEMBERSHIP_FORWARD_TYPE_OPTIONS}
              onSelectMembershipRequest={handlers.selectMembershipRequest}
              onMembershipRequestSubmit={handlers.handleMembershipRequestSave}
              onMembershipRequestFieldChange={
                handlers.updateMembershipRequestField
              }
              onMembershipRequestForward={
                handlers.handleMembershipRequestForward
              }
              onMarkMembershipRequestDone={handlers.markMembershipRequestDone}
              formatRequestDate={formatRequestDate}
              getMembershipRequestTypeLabel={getMembershipRequestTypeLabel}
              getMembershipStatusLabel={getMembershipStatusLabel}
              getMembershipForwardTypeLabel={getMembershipForwardTypeLabel}
            />
          )}
        </div>
      )}

      {activeTab === "pages" && (
        <PagesTab
          pages={pages}
          selectedPageId={selectedPageId}
          selectedPage={selectedPage}
          pageForm={pageForm}
          pageLoading={pageLoading}
          onSelectPage={handlers.selectPage}
          onPageSubmit={handlers.handlePageSave}
          onPageFieldChange={handlers.updatePageField}
          onPageSlugChange={handlers.handlePageSlugChange}
          onResetPageForm={handlers.resetPageForm}
          onDeletePage={handlers.handlePageDelete}
          onAutoSlug={handlers.handlePageTitleBlur}
        />
      )}
    </div>
  );
}
