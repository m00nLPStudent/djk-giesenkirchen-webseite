"use client";

export default function ContributionDialogShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm md:grid md:place-items-center md:p-6">
      <button
        type="button"
        aria-label="Dialog schliessen"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative mx-auto w-full max-w-2xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.5)] md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
              Vereinsbeitraege
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold text-white/65 transition hover:border-red-500 hover:text-white"
          >
            Schliessen
          </button>
        </div>

        <div className="mt-6 space-y-4">{children}</div>

        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
