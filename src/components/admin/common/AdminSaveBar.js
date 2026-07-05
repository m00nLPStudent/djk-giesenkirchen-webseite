import { FormActions } from "@/components/admin/forms";

export default function AdminSaveBar({
  loading,
  submitLabel,
  loadingLabel,
  cancelHref,
}) {
  return (
    <FormActions
      loading={loading}
      submitLabel={submitLabel}
      loadingLabel={loadingLabel}
      cancelHref={cancelHref}
    />
  );
}
