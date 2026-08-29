import Link from "next/link";

export const metadata = {
  title: "Cookie-Einstellungen | DJK/VfL Giesenkirchen",
  description: "Informationen zur vorbereiteten Cookie-Verwaltung.",
};

export default function CookieSettingsPage() {
  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-52 md:pb-24">
      <section className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">Datenschutz</p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Cookie-Einstellungen</h1>
        <p className="mt-8 text-base leading-8 text-white/65">Die individuelle Cookie-Verwaltung wird derzeit vorbereitet. Bis zur Aktivierung werden hier keine Einstellungen vorgetäuscht.</p>
        <p className="mt-5 text-base leading-8 text-white/65">Weitere Informationen zur Verarbeitung personenbezogener Daten findest du in unserer <Link href="/datenschutz" className="font-bold text-red-400 underline decoration-red-400/40 underline-offset-4 transition hover:text-red-300">Datenschutzerklärung</Link>.</p>
      </section>
    </main>
  );
}
