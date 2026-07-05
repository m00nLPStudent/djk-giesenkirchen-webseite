import ContactList from "../components/ContactList";
import ClubContactEditor from "../panels/ClubContactEditor";

export default function ClubContactsTab({
  contacts,
  selectedContactId,
  selectedContact,
  contactForm,
  contactLoading,
  roleTemplates,
  contactCategoryOptions,
  placeholderUrl,
  onSelectContact,
  onContactSubmit,
  onContactFieldChange,
  onContactRoleTemplateChange,
  onContactImageUpload,
  onContactImageRemove,
  onResetContactForm,
  onDeleteContact,
  getCategoryLabel,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <ContactList
        contacts={contacts}
        selectedContactId={selectedContactId}
        onSelectContact={onSelectContact}
        getCategoryLabel={getCategoryLabel}
      />

      <ClubContactEditor
        selectedContact={selectedContact}
        contactForm={contactForm}
        contactLoading={contactLoading}
        roleTemplates={roleTemplates}
        contactCategoryOptions={contactCategoryOptions}
        placeholderUrl={placeholderUrl}
        onSubmit={onContactSubmit}
        onFieldChange={onContactFieldChange}
        onRoleTemplateChange={onContactRoleTemplateChange}
        onUploadImage={onContactImageUpload}
        onRemoveImage={onContactImageRemove}
        onReset={onResetContactForm}
        onDelete={onDeleteContact}
      />
    </div>
  );
}
