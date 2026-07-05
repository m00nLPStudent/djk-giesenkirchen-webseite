export default function SponsorTabs({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <div className="mt-10 flex min-w-0 flex-wrap gap-2 sm:gap-3">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`#${category.slug}`}
          className="min-w-0 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-white/70 transition hover:border-red-500 hover:bg-red-600 hover:text-white sm:px-5 sm:py-3 sm:text-sm"
        >
          <span className="break-words">{category.name_de}</span>
        </a>
      ))}
    </div>
  );
}
