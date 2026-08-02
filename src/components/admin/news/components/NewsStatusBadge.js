import { AdminStatusChip } from "@/components/admin/design-system";

export default function NewsStatusBadge({ isPublished, publishedAt }) {
  const now = new Date();

  if (!isPublished) {
    return <AdminStatusChip variant="blue" compact>Entwurf</AdminStatusChip>;
  }

  if (publishedAt && new Date(publishedAt) > now) {
    return <AdminStatusChip variant="warning" compact>Geplant</AdminStatusChip>;
  }

  return <AdminStatusChip variant="success" compact>Veröffentlicht</AdminStatusChip>;
}
