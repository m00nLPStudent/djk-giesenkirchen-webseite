import AdminSaveBar from "@/components/admin/common/AdminSaveBar";

export default function NewsSaveBar({ loading, isEdit }) {
  return (
    <AdminSaveBar
      loading={loading}
      submitLabel={isEdit ? "Änderungen speichern" : "News speichern"}
      cancelHref="/admin/news"
    />
  );
}
