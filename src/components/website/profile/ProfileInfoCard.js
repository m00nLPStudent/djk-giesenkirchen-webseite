export default function ProfileInfoCard({
  label,
  value,
  href,
  title,
  truncate = false,
  children,
}) {
  const content = (
    <div className="flex min-h-32 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>

      <div
        className={`mt-3 min-w-0 text-2xl font-black leading-tight text-white ${
          truncate ? "truncate whitespace-nowrap" : "break-normal"
        }`}
        title={title || (typeof value === "string" ? value : undefined)}
      >
        {children || value || "-"}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block min-w-0">
      {content}
    </a>
  );
}
