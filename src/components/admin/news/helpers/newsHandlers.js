import {
  createNews,
  deleteNewsDocument,
  getNewsDocuments,
  updateNews,
  uploadNewsDocument,
  uploadNewsImage,
} from "../services/news.service";
import { createNewsPayload } from "./newsPayload";

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
    const { data, error } = await getNewsDocuments(news.id);
    setDocumentsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments(data || []);
  }

  async function uploadImage(file) {
    const { data, error } = await uploadNewsImage(file);

    if (error) {
      alert(error.message);
      return;
    }

    updateField("image_url", data);
  }

  async function handleDocumentUpload(file) {
    if (!news?.id) {
      alert("Bitte speichere die News erst, bevor du Dokumente hochlädst.");
      return;
    }

    setDocumentsLoading(true);
    const { data, error } = await uploadNewsDocument(file, news.id);
    setDocumentsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDocuments((current) => [...current, data]);
    }
  }

  async function handleDocumentDelete(documentItem) {
    if (!documentItem?.id) return;

    const { error } = await deleteNewsDocument(documentItem);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((current) =>
      current.filter((item) => item.id !== documentItem.id),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title_de.trim()) {
      alert("Bitte mindestens einen deutschen Titel eintragen.");
      setActiveTab("basic");
      return;
    }

    setLoading(true);

    const payload = createNewsPayload(form, news);

    const { data: savedNews, error } = isEdit
      ? await updateNews(news.id, payload)
      : await createNews(payload);

    setLoading(false);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    if (!isEdit && savedNews?.id) {
      setDocuments([]);
    }

    router.push("/admin/news");
    router.refresh();
  }

  return {
    updateField,
    loadDocuments,
    uploadImage,
    handleDocumentUpload,
    handleDocumentDelete,
    handleSubmit,
  };
}
