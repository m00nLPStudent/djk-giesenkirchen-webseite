import AdminEmptyState from "./AdminEmptyState";

export default function AdminSelectionList({
  items = [],
  emptyText,
  renderItem,
  containerClassName = "space-y-3",
  emptyClassName,
}) {
  return (
    <div className={containerClassName}>
      {items.length === 0 && (
        <AdminEmptyState text={emptyText} className={emptyClassName} />
      )}
      {items.map((item) => renderItem(item))}
    </div>
  );
}
