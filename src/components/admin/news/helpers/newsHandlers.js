import { createNewsDocumentAction, deleteNewsDocumentAction, loadNewsDocumentsAction } from "@/app/admin/news/actions";
import { createNewsPayload } from "./newsPayload";
import { saveNewsWithAuthorAction } from "@/app/admin/news/actions";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";

export function createNewsHandlers({
  news,
  isEdit,
  form,
  setForm,
  setDocuments,
  setDocumentsLoading,
  setLoading,
  setActiveTab,
  router,
}) {
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function loadDocuments() {
    if (!news?.id) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }

    setDocumentsLoading(true);
    const { data, error } = await loadNewsDocumentsAction(news.id);
    setDocumentsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments(data || []);
  }

  async function handleDocumentSelect(media) {
    if (!news?.id) {
      alert("Bitte speichere die News erst, bevor du Dokumente hochlädst.");
      return;
    }

    setDocumentsLoading(true);
    const { data, error } = await createNewsDocumentAction(news.id, media?.id);
    setDocumentsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDocuments((current) => [...current, data]);
      await revalidatePublicContentAction("news");
    }
  }

  async function handleDocumentDelete(documentItem) {
    if (!documentItem?.id) return;

    const { error } = await deleteNewsDocumentAction(documentItem.id);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((current) =>
      current.filter((item) => item.id !== documentItem.id),
    );

    await revalidatePublicContentAction("news");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    logAdminSaveEvent({
      module: "news",
      mode: isEdit ? "edit" : "create",
      step: "form.submit-triggered",
      success: true,
    });

    if (!form.title_de.trim()) {
      alert("Bitte mindestens einen deutschen Titel eintragen.");
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const payload = createNewsPayload(form, news);

    const { data: savedNews, error } = await saveNewsWithAuthorAction(payload, isEdit ? news.id : null);

    setLoading(false);

    if (error) {
      logAdminSaveEvent({
        module: "news",
        mode: isEdit ? "edit" : "create",
        step: "form.submit-failed",
        success: false,
        error,
        navigationTriggered: false,
      });
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    if (!isEdit && savedNews?.id) {
      setDocuments([]);
    }

    await revalidatePublicContentAction("news");

    logAdminSaveEvent({
      module: "news",
      mode: isEdit ? "edit" : "create",
      step: "form.submit-success",
      success: true,
      data: savedNews,
      navigationTriggered: true,
    });

    router.push("/admin/news");
    router.refresh();
  }

  return {
    updateField,
    loadDocuments,
    handleDocumentSelect,
    handleDocumentDelete,
    handleSubmit,
  };
}
