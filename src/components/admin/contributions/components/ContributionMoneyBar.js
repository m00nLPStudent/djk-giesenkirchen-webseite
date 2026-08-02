import AdminCard from "@/components/admin/common/AdminCard";

function MoneyItem({ item }) {
  return (
    <div
      className={`flex flex-col gap-2 px-4 py-3 md:px-5 md:py-4 ${
        item.emphasis
          ? "bg-amber-500/10"
          : ""
      }`}
    >
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/45">
        {item.compactTitle || item.title}
      </span>
      <span className="text-xl font-black text-white md:text-2xl">{item.value}</span>
    </div>
  );
}

export default function ContributionMoneyBar({ items = [], className = "" }) {
  return (
    <AdminCard className={`overflow-hidden ${className}`.trim()}>
      <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="min-w-0">
            <MoneyItem item={item} />
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
