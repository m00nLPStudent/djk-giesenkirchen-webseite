export default function AdminPageHeader({
  eyebrow = "Adminbereich",
  title,
  description,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-transparent p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] md:p-8 ${className}`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              {eyebrow}
            </p>
          )}

          {title && (
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{title}</h1>
          )}

          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>
        )}
      </div>

      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
