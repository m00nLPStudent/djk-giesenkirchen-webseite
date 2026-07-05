import AdminActionButton from "./AdminActionButton";

export default function AdminSectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  actionVariant = "secondary",
  children,
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-[0.65rem] font-black uppercase tracking-[0.35em] text-red-400">
            {eyebrow}
          </p>
        )}

        {title && (
          <h2 className="mt-2 text-xl font-black text-white md:text-2xl">
            {title}
          </h2>
        )}

        {description && (
          <p className="mt-2 text-sm leading-7 text-white/55 md:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 md:justify-end">
        {children}
        {actionLabel && actionHref && (
          <AdminActionButton href={actionHref} variant={actionVariant}>
            {actionLabel}
          </AdminActionButton>
        )}
      </div>
    </div>
  );
}
