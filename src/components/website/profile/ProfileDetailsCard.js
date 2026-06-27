function DetailItem({ label, value, href, type = "text" }) {
  const valueClass = type === "email" ? "text-base md:text-lg" : "text-lg md:text-xl";
  const content = (
    <div className="min-w-0 border-b border-white/10 py-4 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p className={`mt-2 min-w-0 break-words font-black leading-snug text-white ${valueClass}`}>
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
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
        {title}
      </p>

      <div className="mt-5 grid gap-x-8 md:grid-cols-2">
        {items.map((item) => (
          <DetailItem key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
