export function StatisticCard({ item, active = false, onClick }) {
  const Icon = item.icon;
  const isClickable = typeof onClick === "function";
  const Component = isClickable ? "button" : "div";

  return (
    <Component
      type={isClickable ? "button" : undefined}
      onClick={isClickable ? () => onClick(item.filter) : undefined}
      className={`rounded-3xl border p-6 text-left transition ${
        active
          ? "border-red-500 bg-red-500/10"
          : "border-white/10 bg-white/5 hover:border-red-500/50 hover:bg-white/10"
      } ${isClickable ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg || "bg-white/10"}`}
          >
            <Icon className={item.color || "text-white/60"} size={28} />
          </div>
        )}

        <p className="text-4xl font-black">{item.value}</p>
      </div>

      <h2 className="mt-6 text-xl font-black">{item.title}</h2>
      {item.description && (
        <p className="mt-2 text-sm text-white/45">{item.description}</p>
      )}
    </Component>
  );
}

export default function StatisticGrid({
  items = [],
  activeFilter,
  onFilterChange,
  className = "mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4",
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <StatisticCard
          key={item.title}
          item={item}
          active={activeFilter === item.filter}
          onClick={onFilterChange}
        />
      ))}
    </div>
  );
}
