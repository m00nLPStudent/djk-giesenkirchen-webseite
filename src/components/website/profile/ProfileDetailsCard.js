function getValueClass(type) {
  const classes = {
    email: "text-base md:text-lg whitespace-nowrap",
    phone: "text-lg md:text-xl whitespace-nowrap",
    license: "text-lg md:text-xl",
    text: "text-lg md:text-xl",
  };

  return classes[type] || classes.text;
}

function getGridClass(columns) {
  const classes = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return classes[columns] || classes[2];
}

function getCompletedItems(items, columns) {
  const missingItems = items.length % columns;

  if (!missingItems) return items;

  return [
    ...items,
    ...Array.from({ length: columns - missingItems }, (_, index) => ({
      label: `empty-${index}`,
      value: "",
      isEmpty: true,
    })),
  ];
}

function DetailContent({ label, value, type = "text", isEmpty = false }) {
  if (isEmpty) {
    return <span aria-hidden="true" />;
  }

  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p
        className={`mt-2 min-w-0 break-normal font-black leading-snug text-white ${getValueClass(type)}`}
        title={typeof value === "string" ? value : undefined}
      >
        {value || "-"}
      </p>
    </>
  );
}

function DetailItem({ item }) {
  const cellClass = "min-h-28 min-w-0 p-5 md:p-6";

  if (item.isEmpty || !item.href) {
    return (
      <div className={cellClass}>
        <DetailContent {...item} />
      </div>
    );
  }

  return (
    <a href={item.href} className={`${cellClass} block transition hover:bg-white/[0.03]`}>
      <DetailContent {...item} />
    </a>
  );
}

export default function ProfileDetailsCard({
  title = "Profildaten",
  items = [],
  columns = 2,
}) {
  const completedItems = getCompletedItems(items, columns);

  return (
    <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
      <div className="p-6 pb-0 md:p-8 md:pb-0">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
          {title}
        </p>
      </div>

      <div
        className={`mt-5 grid divide-y divide-white/10 md:divide-y-0 md:divide-x ${getGridClass(columns)}`}
      >
        {completedItems.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={`min-w-0 ${index >= columns ? "md:border-t md:border-white/10" : ""}`}
          >
            <DetailItem item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
