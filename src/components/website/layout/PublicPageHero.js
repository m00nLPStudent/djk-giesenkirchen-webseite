export default function PublicPageHero({ eyebrow, title, description, children }) {
  return (
    <header className="max-w-4xl">
      {eyebrow && <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400 sm:text-sm sm:tracking-[0.35em]">{eyebrow}</p>}
      <h1 className="mt-4 break-words text-4xl font-black leading-[1.08] sm:text-5xl lg:text-7xl">{title}</h1>
      {description && <p className="mt-5 max-w-3xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">{description}</p>}
      {children}
    </header>
  );
}
