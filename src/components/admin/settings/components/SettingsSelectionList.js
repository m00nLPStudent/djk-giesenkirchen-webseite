import { AdminModuleEmptyState } from "@/components/admin/design-system";

export default function SettingsSelectionList({
  items = [],
  emptyText,
  renderItem,
}) {
  return (
    items.length ? <div className="space-y-3">{items.map(renderItem)}</div> : <AdminModuleEmptyState title={emptyText} />
  );
}
