import AdminSelectionList from "@/components/admin/common/AdminSelectionList";

export default function SettingsSelectionList({
  items = [],
  emptyText,
  renderItem,
}) {
  return (
    <AdminSelectionList
      items={items}
      emptyText={emptyText}
      renderItem={renderItem}
      containerClassName="space-y-3"
    />
  );
}
