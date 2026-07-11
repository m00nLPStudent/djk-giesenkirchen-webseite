export default function PasswordChecklist({ checklist = [] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
        Checkliste
      </p>
      <div className="mt-2 space-y-1.5">
        {checklist.map((entry) => (
          <p
            key={entry.key}
            className={`text-sm ${entry.valid ? "text-emerald-200" : "text-white/60"}`}
          >
            {entry.valid ? "Erfuellt" : "Offen"}: {entry.label}
          </p>
        ))}
      </div>
    </div>
  );
}
