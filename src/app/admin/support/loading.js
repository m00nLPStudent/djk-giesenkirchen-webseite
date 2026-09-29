export default function SupportLoading() {
  return <div role="status" aria-live="polite" className="space-y-4"><div className="h-44 animate-pulse rounded-[2rem] bg-white/[.05]" /><div className="h-20 animate-pulse rounded-[1.5rem] bg-white/[.04]" /><div className="h-64 animate-pulse rounded-[1.5rem] bg-white/[.04]" /><span className="sr-only">Supportbereich wird geladen …</span></div>;
}
