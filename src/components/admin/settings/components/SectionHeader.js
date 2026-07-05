export default function SectionHeader({ eyebrow, title, description, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-white/55">{description}</p>
        ) : null}
      </div>
      {right || null}
    </div>
  );
}
