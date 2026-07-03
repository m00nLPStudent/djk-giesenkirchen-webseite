export default function DepartmentPageLayout({ eyebrow = "Fußballabteilung", title, description, children }) {
  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-48 pb-24 text-white md:pt-56">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">{title}</h1>
        {description && <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">{description}</p>}
        {children}
      </section>
    </main>
  );
}
