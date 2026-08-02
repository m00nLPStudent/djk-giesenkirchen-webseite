"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useImageUpload from "@/components/admin/hooks/useImageUpload";
import ContactForm from "./components/ContactForm";
import { createInitialContactForm } from "./helpers/settingsInitialState";
import { createContactHandlers } from "./helpers/contactHandlers";
import { CONTACT_CATEGORY_OPTIONS, ROLE_TEMPLATES } from "./helpers/settingsOptions";
import { CLUB_CONTACT_PLACEHOLDER_IMAGE, deleteClubContactImage, uploadClubContactImage } from "./settings.service";

export default function SettingsContactEditorView({ initialContact = null }) {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState(initialContact);
  const [form, setForm] = useState(() => createInitialContactForm(initialContact));
  const [loading, setLoading] = useState(false);
  const handlers = createContactHandlers({ router, selectedContactId: selectedContact?.id || null, selectedContact, contactForm: form, setContacts: () => {}, setSelectedContactId: () => {}, setContactForm: setForm, setContactLoading: setLoading, onSaved: (saved) => { setSelectedContact(saved); router.replace(`/admin/settings/contacts/edit/${saved.id}`); }, onDeleted: () => router.replace("/admin/settings?tab=contacts") });
  const { uploadImage, removeImage } = useImageUpload({ currentUrl: form.image_url, placeholderUrl: CLUB_CONTACT_PLACEHOLDER_IMAGE, uploadAction: uploadClubContactImage, deleteAction: deleteClubContactImage, onChange: (url) => handlers.updateContactField("image_url", url), getUploadContext: () => ({ id: selectedContact?.id, role_de: form.role_de, contact_name: form.contact_name }) });
  return <ContactForm selectedContact={selectedContact} contactForm={form} contactLoading={loading} roleTemplates={ROLE_TEMPLATES} contactCategoryOptions={CONTACT_CATEGORY_OPTIONS} placeholderUrl={CLUB_CONTACT_PLACEHOLDER_IMAGE} onSubmit={handlers.handleContactSave} onFieldChange={handlers.updateContactField} onRoleTemplateChange={handlers.updateContactRoleTemplate} onUploadImage={uploadImage} onRemoveImage={removeImage} onReset={() => router.push("/admin/settings/contacts/new")} onDelete={handlers.handleContactDelete} />;
}
