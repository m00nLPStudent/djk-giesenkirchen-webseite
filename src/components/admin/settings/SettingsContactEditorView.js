"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "./components/ContactForm";
import { createInitialContactForm } from "./helpers/settingsInitialState";
import { createContactHandlers } from "./helpers/contactHandlers";
import { CONTACT_CATEGORY_OPTIONS, ROLE_TEMPLATES } from "./helpers/settingsOptions";
import { CLUB_CONTACT_PLACEHOLDER_IMAGE } from "./settings.service";
import { deleteClubContactAction, loadClubContactMediaPickerAction, saveClubContactAction, uploadClubContactMediaAction } from "@/app/admin/settings/contacts/actions";

export default function SettingsContactEditorView({ initialContact = null, initialMedia = null }) {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState(initialContact);
  const [form, setForm] = useState(() => createInitialContactForm(initialContact));
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const handlers = createContactHandlers({ router, selectedContactId: selectedContact?.id || null, selectedContact, contactForm: form, setContacts: () => {}, setSelectedContactId: () => {}, setContactForm: setForm, setContactLoading: setLoading, saveAction: saveClubContactAction, deleteAction: deleteClubContactAction, onSaved: (saved) => { setSelectedContact(saved); router.replace(`/admin/settings/contacts/edit/${saved.id}`); }, onDeleted: () => router.replace("/admin/settings?tab=contacts") });
  function handleMediaChange(media) {
    setSelectedMedia(media);
    setForm((current) => ({
      ...current,
      image_media_asset_id: media?.id || null,
      image_url: media ? current.image_url : "",
      remove_legacy_image: !media,
    }));
  }
  return <ContactForm selectedContact={selectedContact} contactForm={form} contactLoading={loading} roleTemplates={ROLE_TEMPLATES} contactCategoryOptions={CONTACT_CATEGORY_OPTIONS} placeholderUrl={CLUB_CONTACT_PLACEHOLDER_IMAGE} selectedMedia={selectedMedia} onMediaChange={handleMediaChange} loadMediaAction={(filters) => loadClubContactMediaPickerAction(filters, selectedContact?.id || null)} uploadMediaAction={(data) => uploadClubContactMediaAction(data, selectedContact?.id || null)} onSubmit={handlers.handleContactSave} onFieldChange={handlers.updateContactField} onRoleTemplateChange={handlers.updateContactRoleTemplate} onReset={() => router.push("/admin/settings/contacts/new")} onDelete={handlers.handleContactDelete} />;
}
