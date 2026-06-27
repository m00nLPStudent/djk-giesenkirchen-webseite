"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useDeleteEntity({
  entityLabel = "Eintrag",
  entityName = "",
  deleteAction,
  successMessage,
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `${entityLabel} „${entityName}“ wirklich komplett löschen?\n\nDas Profil und ein eigenes Bild werden dauerhaft entfernt.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    const { error } = await deleteAction();
    setDeleting(false);

    if (error) {
      alert("Fehler beim Löschen: " + error.message);
      return;
    }

    if (successMessage) {
      alert(successMessage);
    }

    router.refresh();
  }

  return {
    deleting,
    handleDelete,
  };
}
