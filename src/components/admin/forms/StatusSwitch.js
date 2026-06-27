export default function StatusSwitch({
  checked,
  onChange,
  activeLabel = "Aktiv",
  inactiveLabel = "Inaktiv",
  description = "Steuert, ob dieser Eintrag öffentlich angezeigt wird.",
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Status
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative h-12 w-28 rounded-full border p-1 transition ${
            checked
              ? "border-green-500/40 bg-green-500/20"
              : "border-yellow-500/40 bg-yellow-500/20"
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition ${
              checked ? "left-[4.9rem]" : "left-1"
            }`}
          />
          <span
            className={`relative z-10 flex h-full items-center text-sm font-black transition ${
              checked ? "justify-start pl-3 text-green-300" : "justify-end pr-3 text-yellow-300"
            }`}
          >
            {checked ? activeLabel : inactiveLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
