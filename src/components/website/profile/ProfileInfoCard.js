function getValueClass(type) {
  const classes = {
    email: "text-lg md:text-xl whitespace-nowrap",
    phone: "text-xl md:text-2xl whitespace-nowrap",
    license: "text-xl md:text-2xl break-normal",
    country: "text-xl md:text-2xl break-normal",
    text: "text-2xl break-normal",
  };

  return classes[type] || classes.text;
}

export default function ProfileInfoCard({
  label,
  value,
  href,
  title,
  type = "text",
  children,
}) {
  const cardClass =
    "flex h-full min-h-32 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50";

  const content = (
    <div className={cardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>

      <div
        className={`mt-3 min-w-0 font-black leading-tight text-white ${getValueClass(type)}`}
        title={title || (typeof value === "string" ? value : undefined)}
      >
        {children || value || "-"}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block h-full min-w-0">
      {content}
    </a>
  );
}
