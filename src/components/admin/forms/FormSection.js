export function FormSection({ eyebrow, title, description, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="mb-6">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              {eyebrow}
            </p>
          )}

          {title && <h2 className="mt-2 text-2xl font-black">{title}</h2>}

          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

export function FormGrid({ children, columns = 2, className = "" }) {
  const columnClass = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return <div className={`grid gap-4 ${columnClass} ${className}`}>{children}</div>;
}

export function FormAlert({ children, tone = "error", className = "" }) {
  const toneClass =
    tone === "warning"
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
      : "border-red-500/30 bg-red-500/10 text-red-200";

  if (!children) return null;

  return (
    <div className={`rounded-3xl border p-5 ${toneClass} ${className}`}>
      <p className="font-bold">{children}</p>
    </div>
  );
}

export function FormHintBox({ eyebrow, children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-black/20 p-5 ${className}`}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
          {eyebrow}
        </p>
      )}
      <div className="mt-3 text-sm leading-6 text-white/55">{children}</div>
    </div>
  );
}

export function FormValuePreview({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm text-white/70">
        {value || "Noch nicht erkannt."}
      </p>
    </div>
  );
}

export function FormActions({ loading, submitLabel, loadingLabel = "Speichert...", cancelHref }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
      {cancelHref && (
        <a
          href={cancelHref}
          className="rounded-full border border-white/10 px-7 py-4 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
        >
          Abbrechen
        </a>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-red-600 px-8 py-4 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  );
}
