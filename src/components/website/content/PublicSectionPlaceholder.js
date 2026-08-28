import Link from "next/link";

export default function PublicSectionPlaceholder({
  eyebrow,
  title,
  description,
  items = [],
  backHref,
  backLabel,
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#c4001a33,transparent_32%),#101014] px-4 pt-28 pb-20 text-white sm:px-6 xl:pt-32">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#18181f] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/10 bg-[linear-gradient(125deg,#18181f_10%,#22171b_65%,#42121a_145%)] p-7 sm:p-10 lg:p-14">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/65 sm:text-lg">{description}</p>
        </div>
        <div className="p-7 sm:p-10 lg:p-14">
          <div className="rounded-2xl border border-dashed border-red-400/35 bg-white/[0.045] p-6">
            <p className="font-black text-red-300">Dieser Vereinsbereich wird vorbereitet.</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
              Die Seite ist erreichbar und wird ergänzt, sobald die fachlich geprüften Inhalte und Datenquellen vorliegen.
            </p>
          </div>
          {items.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item} className="rounded-2xl border border-black/10 bg-white px-5 py-4 font-bold text-[#292930] shadow-sm">{item}</div>
              ))}
            </div>
          )}
          {backHref && (
            <Link href={backHref} className="mt-8 inline-flex rounded-full bg-[#19191f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c4001a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4001a]">
              {backLabel || "Zur Übersicht"}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
