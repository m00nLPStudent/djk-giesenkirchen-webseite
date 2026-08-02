import { AdminStatusChip } from "@/components/admin/design-system";

export default function ClubHistoryStatus({ page }) {
  if (!page) return <AdminStatusChip compact>Entwurf</AdminStatusChip>;
  if (page.is_active === false) return <AdminStatusChip compact variant="warning">Inaktiv</AdminStatusChip>;
  if (!page.is_published) return <AdminStatusChip compact>Entwurf</AdminStatusChip>;
  return <AdminStatusChip compact variant="success">Veröffentlicht</AdminStatusChip>;
}
