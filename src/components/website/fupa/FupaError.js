export default function FupaError({ title }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-white/55">
      Für {title} ist noch kein Widget hinterlegt.
    </div>
  );
}
