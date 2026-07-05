import ContactForm from "../components/ContactForm";

export default function ClubContactEditor({
  selectedContact,
  contactForm,
  contactLoading,
  roleTemplates,
  contactCategoryOptions,
  placeholderUrl,
  onSubmit,
  onFieldChange,
  onRoleTemplateChange,
  onUploadImage,
  onRemoveImage,
  onReset,
  onDelete,
}) {
  return (
    <ContactForm
      selectedContact={selectedContact}
      contactForm={contactForm}
      contactLoading={contactLoading}
      roleTemplates={roleTemplates}
      contactCategoryOptions={contactCategoryOptions}
      placeholderUrl={placeholderUrl}
      onSubmit={onSubmit}
      onFieldChange={onFieldChange}
      onRoleTemplateChange={onRoleTemplateChange}
      onUploadImage={onUploadImage}
      onRemoveImage={onRemoveImage}
      onReset={onReset}
      onDelete={onDelete}
    />
  );
}
