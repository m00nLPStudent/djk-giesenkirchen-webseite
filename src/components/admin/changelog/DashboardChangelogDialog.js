"use client";

import { CalendarDays, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useId, useRef } from "react";

function formatReleaseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DashboardChangelogDialog({
  changelog,
  busy,
  error,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const releaseDate = formatReleaseDate(changelog.releaseDate);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        confirmRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm sm:px-6">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#15151b] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
      >
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.22),transparent_48%),rgba(255,255,255,0.025)] px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/15 text-red-200">
              <Sparkles aria-hidden="true" size={23} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
                Version {changelog.version}
              </p>
              <h2 id={titleId} className="mt-2 text-2xl font-black text-white sm:text-3xl">
                {changelog.title}
              </h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-white/65">
                Das ist neu seit deinem letzten Besuch.
              </p>
              {releaseDate ? (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white/50">
                  <CalendarDays aria-hidden="true" size={15} />
                  Veröffentlicht am {releaseDate}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="max-h-[min(52vh,31rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <ol className="space-y-3">
            {changelog.entries.map((entry, index) => (
              <li
                key={entry.title}
                className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 sm:gap-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/12 text-sm font-black text-red-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-white">{entry.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/65">
                    {entry.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-white/10 bg-black/15 px-5 py-4 sm:px-7 sm:py-5">
          {error ? (
            <p role="alert" className="mb-3 text-sm font-bold text-red-300">
              {error}
            </p>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-wait disabled:opacity-65 sm:ml-auto sm:w-auto sm:min-w-40"
          >
            {busy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={19} />
            ) : (
              <CheckCircle2 aria-hidden="true" size={19} />
            )}
            {busy ? "Wird gespeichert …" : "Verstanden"}
          </button>
        </div>
      </section>
    </div>
  );
}
