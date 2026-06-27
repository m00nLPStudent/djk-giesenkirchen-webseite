function getValueClass(type) {
  const classes = {
    email: "text-base md:text-lg whitespace-nowrap",
    phone: "text-lg md:text-xl whitespace-nowrap",
    license: "text-lg md:text-xl",
    text: "text-lg md:text-xl",
  };

  return classes[type] || classes.text;
}

function DetailItem({ label, value, href, type = "text", index, total }) {
  const isLastMobile = index === total - 1;
  const isLastDesktopRow = index >= total - (total % 2 || 2);
  const isRightColumn = index % 2 === 1;

  const itemClass = [
    "min-w-0 py-5",
    !isLastMobile ? "border-b border-white/10" : "",
    !isLastDesktopRow ? "md:border-b md:border-white/10" : "md:border-b-0",
    isRightColumn ? "md:border-l md:border-white/10 md:pl-8" : "md:pr-8",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div className={itemClass}>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p
        className={`mt-2 min-w-0 break-normal font-black leading-snug text-white ${getValueClass(type)}`}
        title={typeof value === "string" ? value : undefined}
      >
        {value || "-"}
      </p>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block min-w-0 transition hover:opacity-80">
      {content}
    </a>
  );
}

export default function ProfileDetailsCard({ title = "Profildaten", items = [] }) {
  return (
    <section className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
        {title}
      </p>

      <div className="mt-4 grid md:grid-cols-2">
        {items.map((item, index) => (
          <DetailItem key={item.label} {...item} index={index} total={items.length} />
        ))}
      </div>
    </section>
  );
}
