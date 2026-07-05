export default function TeamSelectionList({
  items = [],
  selectedIds = [],
  onChange,
  getLabel,
  getMeta,
  emptyText,
}) {
  function toggleItem(id) {
    const nextValue = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    onChange(nextValue);
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-white/55">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              isSelected
                ? "border-red-500 bg-red-500/10 text-white"
                : "border-white/10 bg-black/20 text-white/70 hover:border-red-500 hover:text-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                  isSelected
                    ? "border-red-500 bg-red-600 text-white"
                    : "border-white/20"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span>
                <span className="block font-bold">{getLabel(item)}</span>
                {getMeta?.(item) && (
                  <span className="mt-1 block text-xs text-white/45">
                    {getMeta(item)}
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
