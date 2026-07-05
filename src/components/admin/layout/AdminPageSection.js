export default function AdminPageSection({
  eyebrow,
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.18)] md:p-8 ${className}`}
    >
      {(eyebrow || title || description) && (
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
              {eyebrow}
            </p>
          )}

          {title && (
            <h2 className="mt-3 text-2xl font-black md:text-3xl">{title}</h2>
          )}

          {description && (
            <p className="mt-3 text-sm leading-7 text-white/60 md:text-base">
              {description}
            </p>
          )}
        </div>
      )}

      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
