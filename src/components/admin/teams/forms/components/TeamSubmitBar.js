import AdminSaveBar from "@/components/admin/common/AdminSaveBar";

export default function TeamSubmitBar({ loading }) {
  return (
    <AdminSaveBar
      loading={loading}
      submitLabel="Mannschaft speichern"
      cancelHref="/admin/teams"
    />
  );
}
