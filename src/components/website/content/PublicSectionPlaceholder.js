import Link from "next/link";
import { PublicCard, PublicPageHero, PublicPageShell } from "@/components/website/layout";

export default function PublicSectionPlaceholder({
  eyebrow,
  title,
  description,
  items = [],
  backHref,
  backLabel,
}) {
  return (
    <PublicPageShell width="max-w-6xl">
      <PublicPageHero eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12 space-y-6">
        <PublicCard className="border-dashed border-red-400/35">
            <p className="font-black text-red-300">Dieser Vereinsbereich wird vorbereitet.</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
              Die Seite ist erreichbar und wird ergänzt, sobald die fachlich geprüften Inhalte und Datenquellen vorliegen.
            </p>
        </PublicCard>
          {items.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <PublicCard key={item} className="p-5 font-bold text-white/85 sm:p-5">{item}</PublicCard>
              ))}
            </div>
          )}
          {backHref && (
            <Link href={backHref} className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:border-red-500 hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">
              {backLabel || "Zur Übersicht"}
            </Link>
          )}
      </div>
    </PublicPageShell>
  );
}
