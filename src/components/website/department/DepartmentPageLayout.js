export default function DepartmentPageLayout({
  eyebrow = "Fußballabteilung",
  title,
  description,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-32 pb-20 text-white sm:px-6 md:pt-56 md:pb-24">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-7xl">
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
            {description}
          </p>
        )}
        {children}
      </section>
    </main>
  );
}
