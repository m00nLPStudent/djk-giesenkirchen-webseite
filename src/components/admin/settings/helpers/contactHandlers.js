import {
  createClubContact,
  deleteClubContact,
  updateClubContact,
} from "../settings.service";
import {
  createInitialContactForm,
  sortedByOrder,
} from "./settingsInitialState";
import { ROLE_TEMPLATE_BY_VALUE } from "./settingsOptions";
import { createFieldUpdater } from "./fieldUpdater";

export function createContactHandlers({
  router,
  selectedContactId,
  selectedContact,
  contactForm,
  setContacts,
  setSelectedContactId,
  setContactForm,
  setContactLoading,
}) {
  const updateContactField = createFieldUpdater(setContactForm);

  function selectContact(contact) {
    setSelectedContactId(contact?.id || null);
    setContactForm(createInitialContactForm(contact));
  }

  function resetContactForm() {
    setSelectedContactId(null);
    setContactForm(createInitialContactForm());
  }

  function updateContactRoleTemplate(value) {
    const template = ROLE_TEMPLATE_BY_VALUE[value];

    setContactForm((current) => {
      if (!template || value === "sonstiges") {
        return { ...current, role_template: value };
      }

      return {
        ...current,
        role_template: value,
        role_de: template.role_de,
        role_en: template.role_en,
      };
    });
  }

  async function handleContactSave(event) {
    event.preventDefault();

    if (!contactForm.role_de.trim() || !contactForm.contact_name.trim()) {
      alert("Bitte Rolle (DE) und Name ausfüllen.");
      return;
    }

    setContactLoading(true);
    const result = selectedContactId
      ? await updateClubContact(selectedContactId, contactForm)
      : await createClubContact(contactForm);
    setContactLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern des Kontakts.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Kontakt wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setContacts((current) => {
      const next = selectedContactId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectContact(saved);
    alert("Kontakt gespeichert.");
    router.refresh();
  }

  async function handleContactDelete() {
    if (!selectedContact) return;

    const confirmed = window.confirm(
      `Kontakt "${selectedContact.role_de}" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deleteClubContact(selectedContact.id);
    if (error) {
      alert(error.message || "Kontakt konnte nicht gelöscht werden.");
      return;
    }

    setContacts((current) =>
      current.filter((item) => item.id !== selectedContact.id),
    );
    resetContactForm();
    alert("Kontakt gelöscht.");
    router.refresh();
  }

  return {
    updateContactField,
    selectContact,
    resetContactForm,
    updateContactRoleTemplate,
    handleContactSave,
    handleContactDelete,
  };
}
