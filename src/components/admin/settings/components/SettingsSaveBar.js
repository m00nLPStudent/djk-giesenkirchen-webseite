export default function SettingsSaveBar({
  onReset,
  onDelete,
  onSubmit,
  hasSelection,
  loading,
  newLabel,
  deleteLabel,
  saveLabel,
  loadingLabel,
}) {
  return (
    <div className="space-y-6">
      <AdminActionBar className="justify-end">
      <AdminButton onClick={onReset}>
        {newLabel}
      </AdminButton>
      <AdminButton variant="primary" type="submit" onClick={onSubmit} disabled={loading}>
        {loading ? loadingLabel : saveLabel}
      </AdminButton>
      </AdminActionBar>
      {hasSelection && <AdminDangerZone title={deleteLabel} description="Dieser bestehende Eintrag wird dauerhaft entfernt.">
        <AdminButton variant="danger" onClick={onDelete}>{deleteLabel}</AdminButton>
      </AdminDangerZone>}
    </div>
  );
}
import { AdminActionBar, AdminButton, AdminDangerZone } from "@/components/admin/design-system";
