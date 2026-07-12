import { saveClubSettings } from "../settings.service";
import { createClubSettingsForm } from "./settingsInitialState";
import { createFieldUpdater } from "./fieldUpdater";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";

export function createClubSettingsHandlers({
  router,
  clubSettings,
  clubForm,
  setClubSettings,
  setClubForm,
  setClubLoading,
}) {
  const updateClubField = createFieldUpdater(setClubForm);

  async function handleClubSave(event) {
    event.preventDefault();
    setClubLoading(true);
    const { data, error } = await saveClubSettings(
      clubForm,
      clubSettings?.id || null,
    );
    setClubLoading(false);

    if (error) {
      alert(error.message || "Fehler beim Speichern der Vereinsdaten.");
      return;
    }

    const nextSettings = data || clubSettings || null;
    setClubSettings(nextSettings);
    if (nextSettings) setClubForm(createClubSettingsForm(nextSettings));
    await revalidatePublicContentAction("settings");
    alert("Vereinsdaten gespeichert.");
    router.refresh();
  }

  return {
    updateClubField,
    handleClubSave,
  };
}
