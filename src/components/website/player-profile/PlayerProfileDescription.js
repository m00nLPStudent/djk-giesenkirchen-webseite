export default function PlayerProfileDescription({ description }) {
  if (!description) return null;

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        Beschreibung Englisch
      </p>
      <p className="mt-4 leading-7 text-white/70">{description}</p>
    </div>
  );
}
