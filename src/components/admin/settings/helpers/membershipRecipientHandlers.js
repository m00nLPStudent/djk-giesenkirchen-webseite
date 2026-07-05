import {
  createMembershipRecipient,
  deleteMembershipRecipient,
  updateMembershipRecipient,
} from "../settings.service";
import {
  createInitialMembershipRecipientForm,
  sortedByOrder,
} from "./settingsInitialState";
import { createFieldUpdater } from "./fieldUpdater";

export function createMembershipRecipientHandlers({
  router,
  selectedMembershipRecipientId,
  selectedMembershipRecipient,
  membershipRecipientForm,
  setMembershipRecipients,
  setSelectedMembershipRecipientId,
  setMembershipRecipientForm,
  setMembershipRecipientLoading,
}) {
  const updateMembershipRecipientField = createFieldUpdater(
    setMembershipRecipientForm,
  );

  function selectMembershipRecipient(item) {
    setSelectedMembershipRecipientId(item?.id || null);
    setMembershipRecipientForm(createInitialMembershipRecipientForm(item));
  }

  function resetMembershipRecipientForm() {
    setSelectedMembershipRecipientId(null);
    setMembershipRecipientForm(createInitialMembershipRecipientForm());
  }

  async function handleMembershipRecipientSave(event) {
    event.preventDefault();
    if (!membershipRecipientForm.email.trim()) {
      alert("Bitte eine E-Mail-Adresse eintragen.");
      return;
    }

    setMembershipRecipientLoading(true);
    const result = selectedMembershipRecipientId
      ? await updateMembershipRecipient(
          selectedMembershipRecipientId,
          membershipRecipientForm,
        )
      : await createMembershipRecipient(membershipRecipientForm);
    setMembershipRecipientLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern des Empfängers.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Empfänger wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setMembershipRecipients((current) => {
      const next = selectedMembershipRecipientId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectMembershipRecipient(saved);
    alert("Empfänger gespeichert.");
    router.refresh();
  }

  async function handleMembershipRecipientDelete() {
    if (!selectedMembershipRecipient) return;

    const confirmed = window.confirm(
      `Empfänger "${selectedMembershipRecipient.email}" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deleteMembershipRecipient(
      selectedMembershipRecipient.id,
    );
    if (error) {
      alert(error.message || "Empfänger konnte nicht gelöscht werden.");
      return;
    }

    setMembershipRecipients((current) =>
      current.filter((item) => item.id !== selectedMembershipRecipient.id),
    );
    resetMembershipRecipientForm();
    alert("Empfänger gelöscht.");
    router.refresh();
  }

  return {
    updateMembershipRecipientField,
    selectMembershipRecipient,
    resetMembershipRecipientForm,
    handleMembershipRecipientSave,
    handleMembershipRecipientDelete,
  };
}
