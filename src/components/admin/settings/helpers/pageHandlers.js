import { deletePage, savePage } from "../settings.service";
import { createInitialPageForm, sortedByOrder } from "./settingsInitialState";
import { createPreparedPageForm, normalizeSlug } from "./settingsPayload";
import { createFieldUpdater } from "./fieldUpdater";

export function createPageHandlers({
  router,
  selectedPageId,
  selectedPage,
  pageForm,
  setPages,
  setSelectedPageId,
  setPageForm,
  setPageLoading,
}) {
  const updatePageField = createFieldUpdater(setPageForm);

  function selectPage(page) {
    setSelectedPageId(page?.id || null);
    setPageForm(createInitialPageForm(page));
  }

  function resetPageForm() {
    setSelectedPageId(null);
    setPageForm(createInitialPageForm());
  }

  function handlePageSlugChange(value) {
    updatePageField("slug", normalizeSlug(value));
  }

  function handlePageTitleBlur() {
    if (!pageForm.slug.trim() && pageForm.title_de.trim()) {
      updatePageField("slug", normalizeSlug(pageForm.title_de));
    }
  }

  async function handlePageSave(event) {
    event.preventDefault();

    const preparedForm = createPreparedPageForm(pageForm);
    if (!preparedForm.slug || !preparedForm.title_de.trim()) {
      alert("Bitte mindestens Slug und Titel (DE) eintragen.");
      return;
    }

    setPageLoading(true);
    const result = await savePage(preparedForm, selectedPageId);
    setPageLoading(false);

    if (result.error) {
      alert(result.error.message || "Fehler beim Speichern der Seite.");
      return;
    }

    const saved = result.data;
    if (!saved) {
      alert(
        "Seite wurde gespeichert, konnte aber nicht direkt zurückgeladen werden.",
      );
      router.refresh();
      return;
    }

    setPages((current) => {
      const next = selectedPageId
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved];
      return sortedByOrder(next);
    });

    selectPage(saved);
    alert("Seite gespeichert.");
    router.refresh();
  }

  async function handlePageDelete() {
    if (!selectedPage) return;

    const confirmed = window.confirm(
      `Seite "${selectedPage.title_de || selectedPage.slug}" wirklich löschen?`,
    );
    if (!confirmed) return;

    const { error } = await deletePage(selectedPage.id);
    if (error) {
      alert(error.message || "Seite konnte nicht gelöscht werden.");
      return;
    }

    setPages((current) =>
      current.filter((item) => item.id !== selectedPage.id),
    );
    resetPageForm();
    alert("Seite gelöscht.");
    router.refresh();
  }

  return {
    updatePageField,
    selectPage,
    resetPageForm,
    handlePageSlugChange,
    handlePageTitleBlur,
    handlePageSave,
    handlePageDelete,
  };
}
